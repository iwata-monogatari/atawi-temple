let cachedKeys;

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function getAccessKeys(teamDomain) {
  if (cachedKeys && cachedKeys.expires > Date.now()) return cachedKeys.keys;
  const response = await fetch(`${teamDomain}/cdn-cgi/access/certs`);
  if (!response.ok) throw new Error("Cloudflare Access public keys could not be loaded.");
  const body = await response.json();
  cachedKeys = { keys: body.keys || [], expires: Date.now() + 60 * 60 * 1000 };
  return cachedKeys.keys;
}

export async function verifyAccess(request, env) {
  const teamDomain = String(env.CF_ACCESS_TEAM_DOMAIN || "").replace(/\/$/, "");
  const audience = String(env.CF_ACCESS_AUD || "");
  const adminEmail = String(env.ATAWI_ADMIN_EMAIL || "").trim().toLowerCase();
  if (!teamDomain || !audience || !adminEmail) throw new Error("Admin authentication is not configured.");

  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0])));
  const claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1])));
  const key = (await getAccessKeys(teamDomain)).find((candidate) => candidate.kid === header.kid);
  if (!key || header.alg !== "RS256") return false;

  const publicKey = await crypto.subtle.importKey(
    "jwk",
    key,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const validSignature = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    publicKey,
    decodeBase64Url(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  const now = Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  return validSignature
    && claims.iss === teamDomain
    && audiences.includes(audience)
    && claims.exp > now
    && (!claims.nbf || claims.nbf <= now)
    && String(claims.email || "").toLowerCase() === adminEmail;
}
