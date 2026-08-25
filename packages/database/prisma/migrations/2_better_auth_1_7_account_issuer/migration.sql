-- Better Auth 1.7 identifies an external account by its trusted issuer and
-- provider-assigned account ID.
ALTER TABLE "account" ADD COLUMN "issuer" STRING;

-- Development and production use different Auth0 tenants. Decode the issuer
-- recorded in the existing ID token and accept only the two configured tenant
-- issuers. A missing/invalid token, an unknown issuer, or an unexpected provider
-- leaves the column NULL so the NOT NULL change below fails safely instead of
-- assigning an identity to an untrusted namespace.
UPDATE "account"
SET "issuer" = CASE (
    convert_from(
        decode(
            translate(split_part("id_token", '.', 2), '-_', '+/')
                || repeat(
                    '=',
                    (4 - length(translate(split_part("id_token", '.', 2), '-_', '+/')) % 4) % 4
                ),
            'base64'
        ),
        'UTF8'
    )::JSONB ->> 'iss'
)
    WHEN 'https://s-hirano-dev.jp.auth0.com/' THEN 'https://s-hirano-dev.jp.auth0.com/'
    WHEN 'https://s-hirano.jp.auth0.com/' THEN 'https://s-hirano.jp.auth0.com/'
    ELSE NULL
END
WHERE "provider_id" = 'auth0'
  AND "id_token" IS NOT NULL;

ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL;

-- Duplicate issuer/account pairs fail this migration and must be reviewed
-- manually; no existing identity is deleted or merged automatically.
CREATE UNIQUE INDEX "account_issuer_account_id_key"
ON "account"("issuer", "account_id");
