# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.6.4](https://github.com/s-hirano-ist/s-private/compare/v1.6.3...v1.6.4) (2024-10-30)


### Bug Fixes

* 🐛 bug on docker push ([cd25d32](https://github.com/s-hirano-ist/s-private/commit/cd25d320826cf18532c1ffc186df8660dc6749e8))
* 🐛 build and update license gh actionlint ([912629e](https://github.com/s-hirano-ist/s-private/commit/912629e8e6ba91b9b2a52b8a1854a346d0fb432a))
* 🐛 health check of docker container ([057fa09](https://github.com/s-hirano-ist/s-private/commit/057fa0997858ef1ff62f834ac41d4c4a479a5eee))
* 🐛 healthcheck of dockerfile ([ac4f1d6](https://github.com/s-hirano-ist/s-private/commit/ac4f1d6a98ae42a8c8c646198d5e7b3e3c920921))
* 🐛 jotai reset on tab move ([5e8974b](https://github.com/s-hirano-ist/s-private/commit/5e8974b5b0d50f24418f69db662e535425f57e8f))
* 🐛 revert docker compose file for no profile ([4fc5d24](https://github.com/s-hirano-ist/s-private/commit/4fc5d24f65f7022f90b3f44ca1a7501d296f2478))
* 🐛 signout not deleting cache ([873c0d8](https://github.com/s-hirano-ist/s-private/commit/873c0d80c9cf4f2e535306c08b352acde11548fa))
* 🐛 update submodule bug on submodule update ([f8463c2](https://github.com/s-hirano-ist/s-private/commit/f8463c26d62c76b05e60500b24ef2f30be5eb246))

## [1.7.0](https://github.com/s-hirano-ist/s-private/compare/v1.6.3...v1.7.0) (2024-10-28)


### リファクタリング

* 💡 dockerfile ([a0ba2bb](https://github.com/s-hirano-ist/s-private/commit/a0ba2bb7eefbe52e7368dbf023dd7a89e8d279af))


### ビルドプロセスまたは補助ツールの変更

* 🤖 add docker compose port for dev dockerfile ([d2b84af](https://github.com/s-hirano-ist/s-private/commit/d2b84af94e8df7b0f167fd4baabb3f35eaaacfd6))

### [1.6.3](https://github.com/s-hirano-ist/s-private/compare/v1.6.2...v1.6.3) (2024-10-28)


### リファクタリング

* 💡 file name to show it redirects ([393595d](https://github.com/s-hirano-ist/s-private/commit/393595dca4b951806d5766cfb2b1dae324ae2091))


### 新機能

* 🎸 add pino ([644eb0b](https://github.com/s-hirano-ist/s-private/commit/644eb0bbdde9a222a3af24367fed7e507cbfefce))


### バグ修正

* 🐛 change 403 to 401 for precise ([eb38c51](https://github.com/s-hirano-ist/s-private/commit/eb38c51c72e4f32dbf7b8b5d57a8bcf2a3d6cf89))
* 🐛 security issue on root page ([c2a22cb](https://github.com/s-hirano-ist/s-private/commit/c2a22cb2ecaf4914defe8d0590f93b5df6126ccf))


### ビルドプロセスまたは補助ツールの変更

* 🤖 change webmanifest to ts file ([d1c2997](https://github.com/s-hirano-ist/s-private/commit/d1c299704196b3c3acc0f1fcfe6325223a042649))
* 🤖 renovate github actions all in one place ([3504a58](https://github.com/s-hirano-ist/s-private/commit/3504a58ebc3d1798a5fa2342a8023be5448a238a))
* **deps:** update actions/cache digest to 6849a64 ([0ca3c74](https://github.com/s-hirano-ist/s-private/commit/0ca3c748f1f8175eac192019d06beeed47535c82))
* **deps:** update actions/checkout digest to 11bd719 ([60b21a0](https://github.com/s-hirano-ist/s-private/commit/60b21a0484e77346f9a1b9b81e5882fd71ceb964))
* **deps:** update actions/setup-node digest to 39370e3 ([01b5297](https://github.com/s-hirano-ist/s-private/commit/01b529760c2569c1acdc723232a5e44a1c21ca4b))

### [1.6.2](https://github.com/s-hirano-ist/s-private/compare/v1.6.1...v1.6.2) (2024-10-27)

### [1.6.1](https://github.com/s-hirano-ist/s-private/compare/v1.6.0...v1.6.1) (2024-10-27)


### ビルドプロセスまたは補助ツールの変更

* 🤖 add docker hub option ([79d72d6](https://github.com/s-hirano-ist/s-private/commit/79d72d677a2a8511e066477f626cdd120da70c14))
* **deps:** update dependency @chromatic-com/storybook to v3 ([4bfc171](https://github.com/s-hirano-ist/s-private/commit/4bfc17124b25128ace019c17909e9fe7f871938d))
* **deps:** update minor ([2dad6de](https://github.com/s-hirano-ist/s-private/commit/2dad6dece37b5d1d329b532658f70f6ffb5db735))


### 新機能

* 🎸 add docker push command for db and storybook ([564b3ef](https://github.com/s-hirano-ist/s-private/commit/564b3ef5bd4f1ae5bb8f8b7453876d18f8695b99))


### ドキュメント

* ✏️ update description of docker hub ([5c758a7](https://github.com/s-hirano-ist/s-private/commit/5c758a72eeb4f3a824714d75d2e0fd731ce2fc75))
* ✏️ update prod description of README ([4fc19cb](https://github.com/s-hirano-ist/s-private/commit/4fc19cba40441e9d1ab14c987cbe84709a980b24))


### バグ修正

* 🐛 bcryptjs error ([aec7843](https://github.com/s-hirano-ist/s-private/commit/aec7843b451b339ab495535038238153a3216adc)), closes [#508](https://github.com/s-hirano-ist/s-private/issues/508)


### リファクタリング

* 💡 add comments to refactor docker hub push ([10a6022](https://github.com/s-hirano-ist/s-private/commit/10a6022a4d342ec30a8745a95b1318457d5cbdb8))
* 💡 add todo on health check ([e953d3a](https://github.com/s-hirano-ist/s-private/commit/e953d3a0a044f3f804dacc390b0f2b63ef3190da))
* 💡 delete docker compose for s-tools ([ab758e8](https://github.com/s-hirano-ist/s-private/commit/ab758e8443fb87742cd6f9ee9ff8175257a0b7e2))
* 💡 docker network and profile ([2b4864c](https://github.com/s-hirano-ist/s-private/commit/2b4864c196f5442619269a2dde08ee032b773af5))

## [1.6.0](https://github.com/s-hirano-ist/s-private/compare/v1.5.0...v1.6.0) (2024-10-25)


### リファクタリング

* 💡 add comments on window.reload ([9a8a712](https://github.com/s-hirano-ist/s-private/commit/9a8a7127209161353c7ddfa1c1c8787d50a12eb9))
* 💡 smartphone padding ([5c36889](https://github.com/s-hirano-ist/s-private/commit/5c368893d10f6935e6073e0825c10e154ee1c8dc)), closes [#526](https://github.com/s-hirano-ist/s-private/issues/526)

## [1.5.0](https://github.com/s-hirano-ist/s-private/compare/v1.4.0...v1.5.0) (2024-10-23)


### ドキュメント

* ✏️ update license ([0e935e4](https://github.com/s-hirano-ist/s-private/commit/0e935e456ea57c817a1768f4d0a7f8365799ff7d))
* ✏️ update README ([a729a33](https://github.com/s-hirano-ist/s-private/commit/a729a33d5c5f37479884abd8413767f47ff00487))


### ビルドプロセスまたは補助ツールの変更

* 🤖 delete scripts for dump ([b5b3c26](https://github.com/s-hirano-ist/s-private/commit/b5b3c26d066c03de1021b49d676b4b397c71846c))
* 🤖 downgrade vaul ([9a125d5](https://github.com/s-hirano-ist/s-private/commit/9a125d53682c9f89f969413bee04e216c9c206cf))
* 🤖 separate storybook from prod env ([3a1dc2e](https://github.com/s-hirano-ist/s-private/commit/3a1dc2e17c523c8f91beaf950d5129e0bd6cec73))
* **deps:** update patch ([cb8ce8f](https://github.com/s-hirano-ist/s-private/commit/cb8ce8f457b4c4e60b4ec9b1dc21c5ff5bba711b))


### バグ修正

* 🐛 add more envs to compose.yaml ([4d3f503](https://github.com/s-hirano-ist/s-private/commit/4d3f50369816c7c011be022f3a950b65448ecf8b))
* 🐛 change router.replace with window.reload ([c2aa6a1](https://github.com/s-hirano-ist/s-private/commit/c2aa6a1cdb2d83ba95370f5512d0d3ac685f16b4))
* 🐛 router.reload ([6bbfc0b](https://github.com/s-hirano-ist/s-private/commit/6bbfc0b68e17f81aca1f700996e346858b67b15a))
* 🐛 tsconfig to ignore fetch-contents.ts ([2222e77](https://github.com/s-hirano-ist/s-private/commit/2222e77c7141d84bea2e2458b364a38c477cf6de))


### リファクタリング

* 💡 add more to dockerignore ([3ff0a2e](https://github.com/s-hirano-ist/s-private/commit/3ff0a2ea171d778b88d80918a6ac33e9ec5f6044))
* 💡 add security and operation to dockerfile ([454258a](https://github.com/s-hirano-ist/s-private/commit/454258afbd6795ede494abce8ef1b755350775fc))
* 💡 dockerfile ([22ca854](https://github.com/s-hirano-ist/s-private/commit/22ca8541b316f83a03666cf15227cb77a53b5b68))
* 💡 library licenses ([9d34cdb](https://github.com/s-hirano-ist/s-private/commit/9d34cdbc1b5a06984c42f1c99cfa4faa52db372c))

## [1.4.0](https://github.com/s-hirano-ist/s-private/compare/v1.3.0...v1.4.0) (2024-10-22)


### CI関連

* 🎡 update github actions build ([8e1b88d](https://github.com/s-hirano-ist/s-private/commit/8e1b88d879df629ebf1871a4f4e6a9a8c84e3864))


### テストの追加・修正

* 💍 delete test of sleep ([3fa363c](https://github.com/s-hirano-ist/s-private/commit/3fa363c627d8bfd72c4c70b0dc5f983214a8ae95))
* 💍 fix test for sleep function ([113413f](https://github.com/s-hirano-ist/s-private/commit/113413f8a756852aae152d26dce9cce3156d7500))
* 💍 fix tests ([642b980](https://github.com/s-hirano-ist/s-private/commit/642b9804375e02461e1345d11998d978e93cbd5f))


### リファクタリング

* 💡 add auth to server side actions ([61351c1](https://github.com/s-hirano-ist/s-private/commit/61351c1faf2c3745af2152636772313aa7beb84c)), closes [#286](https://github.com/s-hirano-ist/s-private/issues/286)
* 💡 add comments ([dc2ce4a](https://github.com/s-hirano-ist/s-private/commit/dc2ce4aa1b0890c4cbecad7cd8705184894d7b2f))
* 💡 add csp ([3d84086](https://github.com/s-hirano-ist/s-private/commit/3d84086891bc8e7981e4c9fe2b285706ce4065b4))
* 💡 add custom error classes ([f301b7e](https://github.com/s-hirano-ist/s-private/commit/f301b7eca71d4c5e120851d3685ace01ac8e3138))
* 💡 add jsdom to dependencies ([88f183e](https://github.com/s-hirano-ist/s-private/commit/88f183e2744c504a238130dfa3fd6107ba4ca7b9))
* 💡 add more headers for security ([a28966b](https://github.com/s-hirano-ist/s-private/commit/a28966bc142cb7cc3bd09e2ff29f212dc4694285))
* 💡 add no nonce on csp ([afc5d2a](https://github.com/s-hirano-ist/s-private/commit/afc5d2af2e5d67b2da539cf07d365cbe07e5e2db))
* 💡 add props type for component functions ([03da29b](https://github.com/s-hirano-ist/s-private/commit/03da29bf644ac3f80cd94e3551253f7291a65ce0))
* 💡 add trim to schema ([94318d4](https://github.com/s-hirano-ist/s-private/commit/94318d4e939e6d9c9b40ff817544ad5ca12f178f))
* 💡 add use client ([67a686e](https://github.com/s-hirano-ist/s-private/commit/67a686e74664050848e0c4234ded977766cdfb6f))
* 💡 add use server ([e66c4d5](https://github.com/s-hirano-ist/s-private/commit/e66c4d5aa6cc4b2d405a069fce0ba1651dc68ca9))
* 💡 add user table ([dbdf275](https://github.com/s-hirano-ist/s-private/commit/dbdf2757d1822496f8ffbf21f7903f9d183f82c9))
* 💡 change blog and mypage to news and contents ([011471f](https://github.com/s-hirano-ist/s-private/commit/011471fe2104d6240e300ce2820292a014294a2b))
* 💡 change dir for news-columns ([ed3e446](https://github.com/s-hirano-ist/s-private/commit/ed3e4460971d22b7400806aec74c645a2aa0d112))
* 💡 change dirs ([38f691c](https://github.com/s-hirano-ist/s-private/commit/38f691c1cad245840fa7b31e88b43fd12cccb092))
* 💡 change loading to skeleton ([25bb95f](https://github.com/s-hirano-ist/s-private/commit/25bb95f0dac21d9a704b22afa055cd437894f929))
* 💡 change name of error handling ([0310be0](https://github.com/s-hirano-ist/s-private/commit/0310be0713c46381c67f87187ee11c4e05cda75d))
* 💡 change submit to update-status ([8954ebb](https://github.com/s-hirano-ist/s-private/commit/8954ebbcb6374857ab5d76474e078e041da6bf0c))
* 💡 change var name of state to response ([0a498ff](https://github.com/s-hirano-ist/s-private/commit/0a498ff5cabf89c2c52708260e78ec3c951b310f))
* 💡 class name order ([58ce28e](https://github.com/s-hirano-ist/s-private/commit/58ce28e39686c1fdee870faacf51b8c7f9c8bd30))
* 💡 contents pages ([870729e](https://github.com/s-hirano-ist/s-private/commit/870729e6194261e495d1ee4d5512a95286f1e020))
* 💡 delete "*" from line notify ([bd10a36](https://github.com/s-hirano-ist/s-private/commit/bd10a36a7a0573f994594368acf4ba65bd244630))
* 💡 delete dangerously set inner html ([287f83c](https://github.com/s-hirano-ist/s-private/commit/287f83cf12960ead80bbdfe27976fe7874770d16))
* 💡 delete email ([8e0d0ed](https://github.com/s-hirano-ist/s-private/commit/8e0d0edde0cef6f863491fd727ebb3bde2b8947e))
* 💡 delete unused api routes ([19f8f10](https://github.com/s-hirano-ist/s-private/commit/19f8f106bb62b02191768625d5ba1eaf4e626f8c))
* 💡 delete unused codes ([8788a1b](https://github.com/s-hirano-ist/s-private/commit/8788a1bc493bde924ed29f934f397db892c26a42))
* 💡 delete unused functions ([800dffe](https://github.com/s-hirano-ist/s-private/commit/800dffe79b4d2072bfbb8d021bd6fef0bbd4eaf1))
* 💡 delete unused functions ([eb36482](https://github.com/s-hirano-ist/s-private/commit/eb364826feb2e69144f7cc696ff9dd832c69ad2e))
* 💡 delete unused imports ([cf8cc14](https://github.com/s-hirano-ist/s-private/commit/cf8cc14d96e249de8af3b8246239674c9d4290b4))
* 💡 delete userId from props ([28bd7a4](https://github.com/s-hirano-ist/s-private/commit/28bd7a468c11563144cc68cbde5fa5bf3bde823a))
* 💡 dirs ([b4b0a64](https://github.com/s-hirano-ist/s-private/commit/b4b0a64ea764437d71e88ba3230dee972d502066))
* 💡 dirs ([01af8f6](https://github.com/s-hirano-ist/s-private/commit/01af8f60f93fe37c41da4e8679f863ed078d27f1)), closes [#248](https://github.com/s-hirano-ist/s-private/issues/248)
* 💡 dirs and pages ([7eb8f2a](https://github.com/s-hirano-ist/s-private/commit/7eb8f2aa32b30a2384cba97ec15fcf930ff30bcf))
* 💡 do not allow javascript on href ([304a368](https://github.com/s-hirano-ist/s-private/commit/304a368134cb3dd76777ba97448dee331f4df56e))
* 💡 docker settings ([af39a04](https://github.com/s-hirano-ist/s-private/commit/af39a04c32bec87d7a4c19ea673725cb05ac28cb))
* 💡 drawer props ([4ec3801](https://github.com/s-hirano-ist/s-private/commit/4ec3801a9a68feba7eccb71e2c5b01f7bb5e207e))
* 💡 dump and submit pages ([66a0fbf](https://github.com/s-hirano-ist/s-private/commit/66a0fbfd917f5f23a020c6432b57c6d99e28750e))
* 💡 dump components ([c1bc653](https://github.com/s-hirano-ist/s-private/commit/c1bc65358bda9c9133288a9d0c66b1d23bc80993))
* 💡 env for prod and local ([e9c1fc6](https://github.com/s-hirano-ist/s-private/commit/e9c1fc63aeba9bce2895e1ac9d4f82438e7b866f)), closes [#371](https://github.com/s-hirano-ist/s-private/issues/371)
* 💡 error handling ([83f080f](https://github.com/s-hirano-ist/s-private/commit/83f080f4b6b30baffbf673f88c83182107634ea2))
* 💡 fetch apis ([b1e1128](https://github.com/s-hirano-ist/s-private/commit/b1e11286c31506716c7ddfc3f5b66acf5842776d))
* 💡 fetch xxx at prisma ([af529f9](https://github.com/s-hirano-ist/s-private/commit/af529f950836a3cffdba69e7e120a968bd11ca73))
* 💡 fetches ([5bcc533](https://github.com/s-hirano-ist/s-private/commit/5bcc533dd39f09a5885a366e0f78f364f2ca722b))
* 💡 file names ([a700b67](https://github.com/s-hirano-ist/s-private/commit/a700b67d7f88f468261b675ab00dfcbe5f5dd449))
* 💡 fix biome ([9b2f911](https://github.com/s-hirano-ist/s-private/commit/9b2f911341b99fcc87ca5991406be9525b3863a7))
* 💡 fix lint ([f8edb4f](https://github.com/s-hirano-ist/s-private/commit/f8edb4fd8b4e23ec54620f78b13ed080d67492d2))
* 💡 line message api ([a65dcce](https://github.com/s-hirano-ist/s-private/commit/a65dccef0cc064fa2cd014f04475f4e31379dd68))
* 💡 line send message ([5dcd752](https://github.com/s-hirano-ist/s-private/commit/5dcd7520e49762c2244cd6e73b1649a69a5ee330))
* 💡 message for error message on unauthorized ([1d1694e](https://github.com/s-hirano-ist/s-private/commit/1d1694e4e61c16495259cd8e662e47d5448e96db))
* 💡 metadata ([35ae512](https://github.com/s-hirano-ist/s-private/commit/35ae512664dbe581a901a31f00212567daee9b94))
* 💡 move contents to one dir for clean dir structure ([2819033](https://github.com/s-hirano-ist/s-private/commit/281903342bf404496c171e0f938ad39b887331af))
* 💡 move dump to dumper/dump ([300089c](https://github.com/s-hirano-ist/s-private/commit/300089c06dac464922e86fbdffb35cf192e2a437))
* 💡 networks ([df6a812](https://github.com/s-hirano-ist/s-private/commit/df6a812de22a3a38a2a2a5b7841cfb836a30d210))
* 💡 remove auth-core ([51c469f](https://github.com/s-hirano-ist/s-private/commit/51c469f18c691daed72eb4cf6e3af8d11f8f4d05))
* 💡 revert storybook build output ([e54ffcb](https://github.com/s-hirano-ist/s-private/commit/e54ffcba7a960f4035355c04e01ae6669030213a))
* 💡 sanitize href script ([e11c67e](https://github.com/s-hirano-ist/s-private/commit/e11c67e4943400ece1308594277b554498617dc3))
* 💡 script files ([81b533a](https://github.com/s-hirano-ist/s-private/commit/81b533aba5def37cdae9b92ba87350d252f3880f))
* 💡 sentry ([b724dfe](https://github.com/s-hirano-ist/s-private/commit/b724dfe0ad2a687310d8f5b89abb9de4e248ddb1))
* 💡 shadcn ui ([6e36359](https://github.com/s-hirano-ist/s-private/commit/6e3635905329015a091562ca9701bc11bb47605e))
* 💡 small changes ([714af1a](https://github.com/s-hirano-ist/s-private/commit/714af1a7d425c249a76d7342583bb0c7de4616e5))
* 💡 small factors ([931f84f](https://github.com/s-hirano-ist/s-private/commit/931f84fd5b96e9bd96c0962c2faf2265e6b4b63e))
* 💡 tailwind and use server ([37e0207](https://github.com/s-hirano-ist/s-private/commit/37e02078588be796a9b64504821603012621bdeb))
* 💡 throw error instead of returning non url ([1b648f0](https://github.com/s-hirano-ist/s-private/commit/1b648f02b2f1efff30b9b47e44da9662ef1ce7d6))
* 💡 throw errors ([da437dc](https://github.com/s-hirano-ist/s-private/commit/da437dc7599633067a835ef395d0a12bb78b86b4))
* 💡 unify thwow error func ([ea89589](https://github.com/s-hirano-ist/s-private/commit/ea89589aa0ca52f7aaf92ea8eaeef999d4d2dc86))
* 💡 update docker compose file ([6143288](https://github.com/s-hirano-ist/s-private/commit/6143288487e613c983d11962f74807c48bbde88d))


### ビルドプロセスまたは補助ツールの変更

* 🤖 add config for middleware ([0cae83d](https://github.com/s-hirano-ist/s-private/commit/0cae83d6045c5ef0b9c49c362750d5ffbd95ae9f))
* 🤖 add docker compose ([6db5198](https://github.com/s-hirano-ist/s-private/commit/6db5198b4619dee70d6a8482b348bd10ac1406b9))
* 🤖 add docker compose for storybook hosts ([464f5d2](https://github.com/s-hirano-ist/s-private/commit/464f5d2e2be01fc8a0803d9210c3f0833d65ecf8))
* 🤖 add license checker best practice ([dce5d17](https://github.com/s-hirano-ist/s-private/commit/dce5d176e485a436f3af63a75e06b27e89fad23a))
* 🤖 add renovate checker ([06a9c25](https://github.com/s-hirano-ist/s-private/commit/06a9c25fadbc036f32b090e2c8e83240452f41a3))
* 🤖 add scope to db ([0ca685a](https://github.com/s-hirano-ist/s-private/commit/0ca685a6d7b3fa6255994ab4291c5a30c8d21c38))
* 🤖 add sentry ([e256195](https://github.com/s-hirano-ist/s-private/commit/e2561951c51e911521d07e61cbcef680f915f689))
* 🤖 add storybook ci ([1c317a2](https://github.com/s-hirano-ist/s-private/commit/1c317a27ca20f556fc9eff8fc1d726ea40a1596c))
* 🤖 add storybook settings ([1c9ba27](https://github.com/s-hirano-ist/s-private/commit/1c9ba279f533878a6af7d1e699a7d0ac6c1857e8))
* 🤖 add storybook static dirs ([08f042d](https://github.com/s-hirano-ist/s-private/commit/08f042d93e427365d175947268227eeee9ad45eb))
* 🤖 change .env.local to .env ([55fcb62](https://github.com/s-hirano-ist/s-private/commit/55fcb6277bdee1732f075e78835069fc7f91a27a))
* 🤖 changelog config refactor ([869d8a7](https://github.com/s-hirano-ist/s-private/commit/869d8a75c51eeb54d3d78153c664973031aef4ed))
* 🤖 delete prisma from dev dependencies ([7522917](https://github.com/s-hirano-ist/s-private/commit/752291753ab360c6dd51b5b9068daf756971f600))
* 🤖 delete unique on profile name ([74ed802](https://github.com/s-hirano-ist/s-private/commit/74ed802c57534dc27c29b6530f75de13876d840a))
* 🤖 docker compose refactor ([18dfb93](https://github.com/s-hirano-ist/s-private/commit/18dfb93402b3a0daa7672f5d7c0f53d2d3bb9c83))
* 🤖 downgrade vaul for test crash ([6e014ba](https://github.com/s-hirano-ist/s-private/commit/6e014badeab82df354f741059c36aed7e1044b15))
* 🤖 fix scripts for dump to github ([c28146c](https://github.com/s-hirano-ist/s-private/commit/c28146ca3c17eb275a47a97ac395f6592ca83c56))
* 🤖 fixes on build ([251cb75](https://github.com/s-hirano-ist/s-private/commit/251cb751228a9494e3fbf57c8e028f1fb7ae10e6))
* 🤖 format json5 and update ([3e45c67](https://github.com/s-hirano-ist/s-private/commit/3e45c67aadcb4ab4594f3f43c11650e63aab82c6))
* 🤖 introduce audit ([43c9a65](https://github.com/s-hirano-ist/s-private/commit/43c9a65245587151f00c47f51a873d20fad6c79b))
* 🤖 merge user verified to role ([19a140b](https://github.com/s-hirano-ist/s-private/commit/19a140b93016c4af0f36a50f56b651358f0ae1c1))
* 🤖 refactor env names ([59471fb](https://github.com/s-hirano-ist/s-private/commit/59471fbbf1c79aa00e29a828e9eaabc3fc7e0031)), closes [#436](https://github.com/s-hirano-ist/s-private/issues/436)
* 🤖 refactor seed data ([18994f8](https://github.com/s-hirano-ist/s-private/commit/18994f8505f99e8246e82edc834c1eb949f2912e))
* 🤖 revert postgresql from v17 to v15 ([c4a7e9f](https://github.com/s-hirano-ist/s-private/commit/c4a7e9f998b6a86a232ce27680c66cfb52a97b4f))
* 🤖 small settings from mypage ([91f7ccd](https://github.com/s-hirano-ist/s-private/commit/91f7ccde09b56696f04269a15ce2fe7bc80ff4a0))
* 🤖 update docker for scripts ([0c6b5c1](https://github.com/s-hirano-ist/s-private/commit/0c6b5c1522f291eb9f1274a573e9a668676d3197))
* 🤖 update eslint ([75da1c4](https://github.com/s-hirano-ist/s-private/commit/75da1c4b001f40f1968840b428c2ad2607d86729))
* 🤖 update license checker ([534896b](https://github.com/s-hirano-ist/s-private/commit/534896bf0550e80340554082475809c1dfa4c1fc))
* 🤖 update renovate for biome ([deef494](https://github.com/s-hirano-ist/s-private/commit/deef49482d2ec0fa65a57eb8e45989b12f5369ac))
* change webmanifest theme color ([e3d4668](https://github.com/s-hirano-ist/s-private/commit/e3d4668dd71fc81a70a3296cbf29a0c522139617))
* **deps:** lock file maintenance ([d63310a](https://github.com/s-hirano-ist/s-private/commit/d63310a2738d6481a4cc489c0c81e71422093b10))
* **deps:** lock file maintenance ([994e364](https://github.com/s-hirano-ist/s-private/commit/994e364d161f64e449b5392506d163392c8ad711))
* **deps:** lock file maintenance ([624e97a](https://github.com/s-hirano-ist/s-private/commit/624e97ab88faab5b8ccc886ac72ac9aad95d06d9))
* **deps:** pin dependencies ([686fcb0](https://github.com/s-hirano-ist/s-private/commit/686fcb05b8ba31c268245fe5cb8c3b6d7519af13))
* **deps:** update actions/cache digest to 3624ceb ([06f8ae4](https://github.com/s-hirano-ist/s-private/commit/06f8ae496655af1edf3a0260c34545df541181b5))
* **deps:** update actions/checkout digest to eef6144 ([d3f574e](https://github.com/s-hirano-ist/s-private/commit/d3f574e73307bc0c93409e533fdc93d5d7ed17f1))
* **deps:** update davelosert/vitest-coverage-report-action digest to 7727b02 ([444c6ba](https://github.com/s-hirano-ist/s-private/commit/444c6ba5f062aff012c126512c551694c2dda019))
* **deps:** update dependency @chromatic-com/storybook to v2 ([21f8ff2](https://github.com/s-hirano-ist/s-private/commit/21f8ff2312d9aefce52e9e9ae17974a4ac0592a6))
* **deps:** update dependency jsdom to v25 ([2f70b54](https://github.com/s-hirano-ist/s-private/commit/2f70b545c467e70ffb58c557604e295d7c672269))
* **deps:** update dependency ubuntu to v24 ([dc4529c](https://github.com/s-hirano-ist/s-private/commit/dc4529c7695f2ed2c93d24d75bf13b68992053f4))
* **deps:** update httpd:2.4.62 docker digest to 7204bce ([3955673](https://github.com/s-hirano-ist/s-private/commit/3955673c6af61eb38708b80dc1f2b5b29dc120ca))
* **deps:** update httpd:2.4.62 docker digest to bbea290 ([c977452](https://github.com/s-hirano-ist/s-private/commit/c977452e31c411cceb648fccfc17aa3adef41763))
* **deps:** update minor ([1834e97](https://github.com/s-hirano-ist/s-private/commit/1834e97e4920a918f7514fa46bc6032ed8ccb287))
* **deps:** update minor ([16cc42e](https://github.com/s-hirano-ist/s-private/commit/16cc42ea58b739c4d5f8a0d2b55d39f9ff079e21))
* **deps:** update minor ([7652e34](https://github.com/s-hirano-ist/s-private/commit/7652e34bbb59b420523319654dc1d75d0171d878))
* **deps:** update minor ([915d0ac](https://github.com/s-hirano-ist/s-private/commit/915d0ac8645b01a0affe608070184d380078429c))
* **deps:** update minor ([e5f9f65](https://github.com/s-hirano-ist/s-private/commit/e5f9f658f88343e4b57bef445e6d06424a99a28c))
* **deps:** update minor ([31d15df](https://github.com/s-hirano-ist/s-private/commit/31d15dfa9592ce16f9001a787d5f356890a21f15))
* **deps:** update minor ([9d8dfeb](https://github.com/s-hirano-ist/s-private/commit/9d8dfebe8eaf3aaef9300bbf333b3593482209b7))
* **deps:** update minor ([39d2314](https://github.com/s-hirano-ist/s-private/commit/39d23149e545d98a9d3d641b80a6ffc5fdad3173))
* **deps:** update minor ([311650b](https://github.com/s-hirano-ist/s-private/commit/311650b9e2dbda91ef9fd77656e1d721fd68e399))
* **deps:** update node docker tag to v20.17.0 ([161a19b](https://github.com/s-hirano-ist/s-private/commit/161a19b2ba921babbb9f03fa9ad17606a2a5ffb7))
* **deps:** update node.js to v20.18.0 ([a1b691d](https://github.com/s-hirano-ist/s-private/commit/a1b691da92d8bc78c0ee35d5e4c7b751577a5e4e))
* **deps:** update patch ([8a5ade6](https://github.com/s-hirano-ist/s-private/commit/8a5ade6702a0a50f86361b3ab43c379282b36c0d))
* **deps:** update patch ([2788e97](https://github.com/s-hirano-ist/s-private/commit/2788e97a8cd54985ebfd727429854835be7047b3))
* **deps:** update patch ([762fb09](https://github.com/s-hirano-ist/s-private/commit/762fb0915d991ca1c3863cc18740a00a6cc4bf66))
* **deps:** update peter-evans/create-pull-request action to v7 ([0f8625d](https://github.com/s-hirano-ist/s-private/commit/0f8625de3ce652125993226e0dada09090b50742))
* **deps:** update pnpm to v9.10.0 ([a129d62](https://github.com/s-hirano-ist/s-private/commit/a129d626c12ea1073dd720954893019a2e939f52))
* **deps:** update pnpm to v9.11.0 ([380f54d](https://github.com/s-hirano-ist/s-private/commit/380f54dc2e425193c4cf2cc2723e15d0a1767734))
* **deps:** update pnpm to v9.12.0 ([888b81a](https://github.com/s-hirano-ist/s-private/commit/888b81a538a284de48e351b1e48ff30eba89cd01))
* **deps:** update pnpm to v9.12.1 ([1ee24a5](https://github.com/s-hirano-ist/s-private/commit/1ee24a54539b92b649056489582861eefd8dc1c2))
* **deps:** update pnpm to v9.12.2 ([a9f0eb3](https://github.com/s-hirano-ist/s-private/commit/a9f0eb3fdb77ce145d4fad4fcd2d625631a9cd2a))
* **deps:** update pnpm to v9.6.0 ([5c1f677](https://github.com/s-hirano-ist/s-private/commit/5c1f6779644ed157e3ea71e22ebe6ee4aa56b8be))
* **deps:** update pnpm to v9.7.1 ([9b82419](https://github.com/s-hirano-ist/s-private/commit/9b82419698795e607731f6a7efe1d2af4b4c5ba2))
* **deps:** update pnpm to v9.8.0 ([e010a40](https://github.com/s-hirano-ist/s-private/commit/e010a404d451af53b87f0380bde1f414181f2bd4))
* **deps:** update pnpm to v9.9.0 ([c76df33](https://github.com/s-hirano-ist/s-private/commit/c76df3335c550b8e340e792115186d1d5a136120))
* **deps:** update postgres docker tag to v17 ([3e8d842](https://github.com/s-hirano-ist/s-private/commit/3e8d84253cf1741fe65e9a9581d37e110dc6352a))


### 新機能

* 🎸 add auth for books and notes ([e24b3da](https://github.com/s-hirano-ist/s-private/commit/e24b3da672043f467935c8af0159f7280c8aa259))
* 🎸 add auth for dump pages ([bab0b4d](https://github.com/s-hirano-ist/s-private/commit/bab0b4db66992c4f4fff46cb6b21382bb16e2490))
* 🎸 add books and notes ([20de5a0](https://github.com/s-hirano-ist/s-private/commit/20de5a0c51ea68a9a91deb6d2ad511e09e97df7d))
* 🎸 add csp alert which does not work ([0d40702](https://github.com/s-hirano-ist/s-private/commit/0d40702fe4558e641468eae0635eea14af468968))
* 🎸 add jwt and session exp time ([baf86b1](https://github.com/s-hirano-ist/s-private/commit/baf86b1b770e2a6319e6e76c7e21a9e4dd2805f1))
* 🎸 add login history ([d9027bb](https://github.com/s-hirano-ist/s-private/commit/d9027bbc2ed4d0bec9dbbc6e16dce57e007ce95d))
* 🎸 add main page ([8831f1d](https://github.com/s-hirano-ist/s-private/commit/8831f1da199b509132c6e4bf1d6effb28846a66b))
* 🎸 add modal for edit dialog ([8cd4a47](https://github.com/s-hirano-ist/s-private/commit/8cd4a4788fd692204bba3d9d7e8e81a9a4ed6f95))
* 🎸 add more util urls ([2c56a5c](https://github.com/s-hirano-ist/s-private/commit/2c56a5ce68fa25cbcdd106d78c516c1170fdd759))
* 🎸 add normal password auth ([69643f9](https://github.com/s-hirano-ist/s-private/commit/69643f929600f8f6956f219e62210d023e2b52da))
* 🎸 add notes pages ([a58e84f](https://github.com/s-hirano-ist/s-private/commit/a58e84fb110ba0a8f4e50ee8cedefd1facecb72f))
* 🎸 add pages ([cc1213d](https://github.com/s-hirano-ist/s-private/commit/cc1213d26f17760c8a14f3b8c29f15cc81265874))
* 🎸 add password show button ([22be470](https://github.com/s-hirano-ist/s-private/commit/22be470f63b68667dfe2cec117a3561fe01f324c))
* 🎸 add portfolio page on main ([ecc5a37](https://github.com/s-hirano-ist/s-private/commit/ecc5a37ba015a5fe27b2af960c7cac4e412c4f23))
* 🎸 add prisma settings ([76ad1d2](https://github.com/s-hirano-ist/s-private/commit/76ad1d2e4c79a3d24bd55d25a8ae2325854cc2a0))
* 🎸 add profile ([5c0a38f](https://github.com/s-hirano-ist/s-private/commit/5c0a38fcc109a8c26e6ea58f1798e5245dba408f))
* 🎸 add profile page ([36ccdf3](https://github.com/s-hirano-ist/s-private/commit/36ccdf3480bc1640bfbfc622881a095eaaa94b9f))
* 🎸 add profile page ([4d898b0](https://github.com/s-hirano-ist/s-private/commit/4d898b09ff26c9a0f45210b9b3a501f62e31e1ea))
* 🎸 add profile update page ([cf9f1db](https://github.com/s-hirano-ist/s-private/commit/cf9f1db22b46b796e54e33a654d017538039eb7e))
* 🎸 add reload button ([f6a48bc](https://github.com/s-hirano-ist/s-private/commit/f6a48bc421162c6c0e9969bed8d2a16da0bf76b9)), closes [#284](https://github.com/s-hirano-ist/s-private/issues/284)
* 🎸 add revalidate path ([237c5eb](https://github.com/s-hirano-ist/s-private/commit/237c5ebd40cfa384713d7824f270a65e7cd51321))
* 🎸 add storybook dockerfile ([23ba62d](https://github.com/s-hirano-ist/s-private/commit/23ba62d93ef73824e75170075ed6b7a5096352b4))
* 🎸 add submodule ([1846181](https://github.com/s-hirano-ist/s-private/commit/1846181644aa973b70fac0c1221ee77e39f05b7d))
* 🎸 add user card ([1ac37cf](https://github.com/s-hirano-ist/s-private/commit/1ac37cf4765d8a657b1b23ed6c6c9acc31dbc5bf))
* 🎸 add user table and auth table ([5d045f1](https://github.com/s-hirano-ist/s-private/commit/5d045f11c03a13e37f4c8bea732fd9d17040a8a3))
* 🎸 change grad direction ([6658839](https://github.com/s-hirano-ist/s-private/commit/66588390ba3c25a072f3ce1bb2d32edc7d480aa2)), closes [#228](https://github.com/s-hirano-ist/s-private/issues/228)
* 🎸 hash password for more security ([9a19f06](https://github.com/s-hirano-ist/s-private/commit/9a19f06fbf25387c9982f528f520e79daf65c6d2))
* 🎸 small fixes on pages ([c5d8570](https://github.com/s-hirano-ist/s-private/commit/c5d8570a235664bf53fcd054e719ecc9db6d9c09))
* 🎸 update contents ([7e1ba17](https://github.com/s-hirano-ist/s-private/commit/7e1ba17edb00509016fdc72ff44f93f059e565dc))


### ドキュメント

* ✏️ add env.sample description ([8f1efba](https://github.com/s-hirano-ist/s-private/commit/8f1efbaa9c0864d2617102c699915c3e6b4a760b))
* ✏️ update README ([c72bc2c](https://github.com/s-hirano-ist/s-private/commit/c72bc2c766c69ae085c6e7c09873e9a421eb0e35))
* ✏️ update README ([1308d04](https://github.com/s-hirano-ist/s-private/commit/1308d0408b72e6557aee5dbbf576b7641e1993b6))
* ✏️ update README ([272999c](https://github.com/s-hirano-ist/s-private/commit/272999cfec44a7d64310895e8613c0bb0d13435d))
* ✏️ update README of security ([1e2bfa5](https://github.com/s-hirano-ist/s-private/commit/1e2bfa5647335b759ceffab25bc5903ebcdbc8f6))


### バグ修正

* 🐛 404 error on books and notes ([fe0ab2d](https://github.com/s-hirano-ist/s-private/commit/fe0ab2dee3cc84a37caf69abaa088d222edb52e3)), closes [#259](https://github.com/s-hirano-ist/s-private/issues/259)
* 🐛 500 error on generate static params ([f8c8556](https://github.com/s-hirano-ist/s-private/commit/f8c8556f05e354d1d67d5b68e6a4e8efc97c7d85))
* 🐛 add autocomplete attribute ([fed5e18](https://github.com/s-hirano-ist/s-private/commit/fed5e18cd04be2564cdfb388d31d9530aed6bc60))
* 🐛 add href to header icon ([6c6d8af](https://github.com/s-hirano-ist/s-private/commit/6c6d8af7c7d409b6b2e765f5f19297133284b74b)), closes [#298](https://github.com/s-hirano-ist/s-private/issues/298)
* 🐛 add inputMode and type on Input ([d95eee8](https://github.com/s-hirano-ist/s-private/commit/d95eee807db45e60ff958011fbb18ae255875fef))
* 🐛 allow null on quote of mypage ([2abd56d](https://github.com/s-hirano-ist/s-private/commit/2abd56dd0253c11ea80d453df2abc26906d06a31))
* 🐛 biome migration ([8340706](https://github.com/s-hirano-ist/s-private/commit/8340706a55641eaa5b0a495715c52262c3e1dc2e))
* 🐛 bug on not clearing cache of sign in data ([1b6c36b](https://github.com/s-hirano-ist/s-private/commit/1b6c36bd594037678ad26ebc09beac518af08129))
* 🐛 bug on parallel routes ([f9496b1](https://github.com/s-hirano-ist/s-private/commit/f9496b1446ebc3b2f11368f8b3a4b07f99f5d3ad))
* 🐛 build ([9e615a0](https://github.com/s-hirano-ist/s-private/commit/9e615a0529c500dafe42ff02ae20347100e50ad4))
* 🐛 build script skip env validation ([70d125c](https://github.com/s-hirano-ist/s-private/commit/70d125cc02e73f2dcf13de2731fccef32a965fcf))
* 🐛 color of grad ([003a0c8](https://github.com/s-hirano-ist/s-private/commit/003a0c8cb2a1da75b0430ab0062eef3c7bee4494)), closes [#499](https://github.com/s-hirano-ist/s-private/issues/499)
* 🐛 console warnings on links and csss ([4cf7875](https://github.com/s-hirano-ist/s-private/commit/4cf787593fc5c17cd4fdbcefe9b70a9661723ed1))
* 🐛 delete inappropriate audit library ([704df36](https://github.com/s-hirano-ist/s-private/commit/704df364dc4af203e30817d6f06e744746ede71c))
* 🐛 delete storybook ci package json ([0b7f19d](https://github.com/s-hirano-ist/s-private/commit/0b7f19db06e7d1db4acdf31f3b8faff4b8c36c99))
* 🐛 disable dynamic params ([2f40db5](https://github.com/s-hirano-ist/s-private/commit/2f40db5ee88ba9c19159b7bbd6a869e0f942179e))
* 🐛 do not throw error to sentry on dev mode ([6af44da](https://github.com/s-hirano-ist/s-private/commit/6af44da92ddede3a09342f595d612ca9ccefdf56)), closes [#452](https://github.com/s-hirano-ist/s-private/issues/452)
* 🐛 fix renovate settings ([cb43637](https://github.com/s-hirano-ist/s-private/commit/cb43637b3df78ad3fa244426ee80bec30aaff7e4))
* 🐛 footer layout ([eb3227b](https://github.com/s-hirano-ist/s-private/commit/eb3227bac4d336c9f2f2628192e4741dea001d35)), closes [#309](https://github.com/s-hirano-ist/s-private/issues/309)
* 🐛 layout of public profile page ([c7402b2](https://github.com/s-hirano-ist/s-private/commit/c7402b20162444ff12d5e916eb701fbc40596156))
* 🐛 layout of typography classes ([c51b138](https://github.com/s-hirano-ist/s-private/commit/c51b13813849b5637e80744dee974ba3921570ce)), closes [#282](https://github.com/s-hirano-ist/s-private/issues/282)
* 🐛 links ([e9a2bff](https://github.com/s-hirano-ist/s-private/commit/e9a2bffc91a544fd5bc22bbcd5b43838485b7040))
* 🐛 metadata of main page ([eb3733c](https://github.com/s-hirano-ist/s-private/commit/eb3733c838ba61160585c2f5cdb696d79522ba6b))
* 🐛 path on docker script ([51538d3](https://github.com/s-hirano-ist/s-private/commit/51538d385d9de2fc0c95d07b106926e9f34f4cc5))
* 🐛 paths ([89fd092](https://github.com/s-hirano-ist/s-private/commit/89fd092356347882cc726924ceb754f34678f0a5))
* 🐛 permissions ([b0f12ff](https://github.com/s-hirano-ist/s-private/commit/b0f12ff5f558fd02a11ebd736e211870f13a7a14))
* 🐛 quote do not show on all ([95a1782](https://github.com/s-hirano-ist/s-private/commit/95a1782428c2a8942d48dd70d581f3d0ea645327))
* 🐛 revert changes to contents-preview href sanitization ([584a4ee](https://github.com/s-hirano-ist/s-private/commit/584a4eea9990ca0274ec29a02bf72abaa1d97708))
* 🐛 security issue due to  use server ([a0aa3ca](https://github.com/s-hirano-ist/s-private/commit/a0aa3ca4a2a00ece5d4debc0c4af0a0349532801))
* 🐛 sentry build error ([076b822](https://github.com/s-hirano-ist/s-private/commit/076b822d1964c76abe1abef5c9478bcb27b8156a))
* 🐛 sentry csp issues ([f27eebc](https://github.com/s-hirano-ist/s-private/commit/f27eebcfadf74d02c6470029d9e35ac933fd996a))
* 🐛 storybook header ([7cd8b84](https://github.com/s-hirano-ist/s-private/commit/7cd8b84a5ec2ccd9f5189153883b1df95a2cacf3)), closes [#308](https://github.com/s-hirano-ist/s-private/issues/308)
* 🐛 tests and refactor ([cc6552d](https://github.com/s-hirano-ist/s-private/commit/cc6552d0d24c1f73369b0be74d50e73cd6251b18))
* 🐛 type error ([a7e87f5](https://github.com/s-hirano-ist/s-private/commit/a7e87f5e30374cb789431cbfe6dc290847c58cfd))
* 🐛 types ([53ede5e](https://github.com/s-hirano-ist/s-private/commit/53ede5efe373019e214e9343ff2ac6df2d5566ed))
* 🐛 types ([756a565](https://github.com/s-hirano-ist/s-private/commit/756a565f477b68753928d300682da92ff8faa98c))
* 🐛 types ([e3ab0ef](https://github.com/s-hirano-ist/s-private/commit/e3ab0ef6c0d3a7749bee6a680f81eddc9fdb1602))
* 🐛 types ([79e1ff1](https://github.com/s-hirano-ist/s-private/commit/79e1ff15c353b9ca5e5902626ff21134c0f300e2))
* 🐛 types due to prisma migration ([702787f](https://github.com/s-hirano-ist/s-private/commit/702787f05f0dea907d0370362454b7268e3e8ef2))
* 🐛 unauthorized url ([f498374](https://github.com/s-hirano-ist/s-private/commit/f498374c9fea818a27248fd9afcf35dc856ef3a2))

## [1.3.0](https://github.com/s-hirano-ist/s-private/compare/v1.2.0...v1.3.0) (2024-07-21)


### 新機能

* 🎸 add auth ([958e958](https://github.com/s-hirano-ist/s-private/commit/958e958ed143f1b73eeeb0359516d0f29cd34c98))


### バグ修正

* 🐛 padding of header description ([f032c10](https://github.com/s-hirano-ist/s-private/commit/f032c100cb680d7419b602f55e3ddb5995570803))


### テストの追加・修正

* 💍 add more margin on test sleep function ([d09561d](https://github.com/s-hirano-ist/s-private/commit/d09561dbcb228cfdc871feec73808722e9fa12cb))


### ドキュメント

* ✏️ update readme ([941ac51](https://github.com/s-hirano-ist/s-private/commit/941ac5192e7b0393d9bad38732e824c0ae891679))


### リファクタリング

* 💡 add status code component ([e1f3566](https://github.com/s-hirano-ist/s-private/commit/e1f3566b5c602e772a919b111b9dc49d0f299ef1))
* 💡 change dump to s-admin ([54161f9](https://github.com/s-hirano-ist/s-private/commit/54161f9246a2a0f9951508bc380de75a89b54aa6))
* 💡 change name to s-admin ([6d15701](https://github.com/s-hirano-ist/s-private/commit/6d1570147653fc8dd721f0715848f17bee83bde7))
* 💡 padding and margin ([7bfe019](https://github.com/s-hirano-ist/s-private/commit/7bfe01920a716214583aa590c6d553c7e694f50c))
* 💡 status code checker ([e21062f](https://github.com/s-hirano-ist/s-private/commit/e21062fb4b926bee022fb573f261c3e475c21088))


### ビルドプロセスまたは補助ツールの変更

* 🤖 add mainfest ([afc8477](https://github.com/s-hirano-ist/s-private/commit/afc84773c229a1356e576e05e083ecf694056a2b))
* 🤖 change favicon ([37a7a65](https://github.com/s-hirano-ist/s-private/commit/37a7a655cb1b281b5c911730beec19c9a996c3dc))
* 🤖 change s-admin to s-private ([093183e](https://github.com/s-hirano-ist/s-private/commit/093183e11f1637ed46111dec8603658391ee7093))

## [1.2.0](https://github.com/s-hirano-ist/dump-to-github/compare/v1.1.0...v1.2.0) (2024-07-20)


### リファクタリング

* 💡 change snackbar message ([35ae4af](https://github.com/s-hirano-ist/dump-to-github/commit/35ae4af6fcefa18927a855435c84a6706bbb6d07))
* 💡 line message ([7203fae](https://github.com/s-hirano-ist/dump-to-github/commit/7203fae671185717b012ba222028c3b8d5f30b86))
* 💡 small fixes ([f913c57](https://github.com/s-hirano-ist/dump-to-github/commit/f913c57ce5246d95e9b1ee524bd731f89218af4b))
* 💡 table name ([c679d9d](https://github.com/s-hirano-ist/dump-to-github/commit/c679d9d148505822842dbfc32b6821e9d5058301))
* 💡 table names ([1906769](https://github.com/s-hirano-ist/dump-to-github/commit/1906769045b9456119144cd50a949c39b8c2b312))


### バグ修正

* 🐛 204 on loading ([e388391](https://github.com/s-hirano-ist/dump-to-github/commit/e388391079b8171f280a4e1a79414a69f7e125a8))
* 🐛 bug on blog double click chatter ([c6c5517](https://github.com/s-hirano-ist/dump-to-github/commit/c6c5517a61f0d991d8e0cba88df4e9312a34be40))
* 🐛 bug on blog double click chatter ([0c9a719](https://github.com/s-hirano-ist/dump-to-github/commit/0c9a719e892ce481bddd0fb855014b497b07f75b))
* 🐛 disable buttons on submit buttons click ([2017d06](https://github.com/s-hirano-ist/dump-to-github/commit/2017d0632f2d3818886d1a4d001edc4cb9fb9c94))


### ビルドプロセスまたは補助ツールの変更

* 🤖 revert dockerfile version ([2c10a7e](https://github.com/s-hirano-ist/dump-to-github/commit/2c10a7e29434532029e83724842c3794d1b5909b))
* 🤖 update node version on nvmrc ([f471cef](https://github.com/s-hirano-ist/dump-to-github/commit/f471cefcfa7e0121691bbeba99a5bfea35fba0f8))
* 🤖 update pnpm ([74806e6](https://github.com/s-hirano-ist/dump-to-github/commit/74806e6796f5ec7179c03c372b1b6f8b48f4edee))
* **deps:** update minor ([3ff9efb](https://github.com/s-hirano-ist/dump-to-github/commit/3ff9efb8c2b82d15e607806b73d8f045198dd347))
* **deps:** update node.js to v20.15.1 ([9484a74](https://github.com/s-hirano-ist/dump-to-github/commit/9484a74220f6f78c63c1b28283c9a702a032d3f9))
* **deps:** update patch ([461d58d](https://github.com/s-hirano-ist/dump-to-github/commit/461d58d6040fe8bcb4d89be006a919f82b83f002))
* **deps:** update pnpm to v9.5.0 ([2a87f35](https://github.com/s-hirano-ist/dump-to-github/commit/2a87f35a5bd3adf834ae3eae9f74b8fcd6851ba3))
* **deps:** update postgres docker tag to v16 ([b6bbf0b](https://github.com/s-hirano-ist/dump-to-github/commit/b6bbf0b3fcea3c26cf1af54e7fdcb6d79eb8ec55))
* **deps:** update vitest monorepo to v2 ([de0693a](https://github.com/s-hirano-ist/dump-to-github/commit/de0693ac9c43b0ed1051809db4d8f7e0fc104a6a))

## [1.1.0](https://github.com/s-hirano-ist/dump-to-github/compare/v1.0.1...v1.1.0) (2024-07-07)


### バグ修正

* 🐛 format ([00a5dc4](https://github.com/s-hirano-ist/dump-to-github/commit/00a5dc435cba7c4731234f087f1bed7420475646))
* 🐛 header layout ([6c2c374](https://github.com/s-hirano-ist/dump-to-github/commit/6c2c374286882cabeb5b93c04323b833d76fb11a))
* 🐛 loading component error ([419f0b4](https://github.com/s-hirano-ist/dump-to-github/commit/419f0b4f794df2a18ce02e6408dfbc4468c5ee28))
* 🐛 tests ([f6f46af](https://github.com/s-hirano-ist/dump-to-github/commit/f6f46af8ce1b93308a1e8f393d3d122301f89bb9))
* 🐛 toaster position ([88eea07](https://github.com/s-hirano-ist/dump-to-github/commit/88eea07c0f7f47cdffd8cb267d01a104859ed2b3))


### 新機能

* 🎸 add mypage add feature ([1019e9a](https://github.com/s-hirano-ist/dump-to-github/commit/1019e9a99ef613cc7ee7dd6924c61d67d5a0a080))
* 🎸 add mypage show stack ([febbe3b](https://github.com/s-hirano-ist/dump-to-github/commit/febbe3b92cf3610aa0badb83d91138549d345329))
* 🎸 add mypage template ([4eae19b](https://github.com/s-hirano-ist/dump-to-github/commit/4eae19be442735ad7d78699d4d2c5708b3366c3a))
* 🎸 add reset input on submit ([450fe27](https://github.com/s-hirano-ist/dump-to-github/commit/450fe2755019f2b9ac6d1cc1b3c92deb3bce482a)), closes [#187](https://github.com/s-hirano-ist/dump-to-github/issues/187)
* 🎸 add revert and update on mypage ([def9c2e](https://github.com/s-hirano-ist/dump-to-github/commit/def9c2ee97b013d180092c4a5d9b08a92840afbe))
* 🎸 add submit mypage feature ([016af7e](https://github.com/s-hirano-ist/dump-to-github/commit/016af7e9533ca5f975dda18537441e1c878bd1f9))
* 🎸 bottom navigation menu and coloring ([affa679](https://github.com/s-hirano-ist/dump-to-github/commit/affa67993741b2da988ec50006862b344f49bdcb))
* 🎸 change bg color ([5ce70a1](https://github.com/s-hirano-ist/dump-to-github/commit/5ce70a16e5917a8ef73964425e3e6185077945bb)), closes [#172](https://github.com/s-hirano-ist/dump-to-github/issues/172)
* 🎸 change submit button to use useFormStatus ([7da58a7](https://github.com/s-hirano-ist/dump-to-github/commit/7da58a7ebe88a1ba067cd1036c36fc94b803378d))


### ビルドプロセスまたは補助ツールの変更

* 🤖 add shadcn ui command ([f5970ef](https://github.com/s-hirano-ist/dump-to-github/commit/f5970efbefac13f57159a6fbb1d7d1e2fbc3861b))
* 🤖 add storybook (draft) ([f855c78](https://github.com/s-hirano-ist/dump-to-github/commit/f855c78afe4662bc941fa0d57fc8109dc2993da2))
* 🤖 change package.json script ([8564df4](https://github.com/s-hirano-ist/dump-to-github/commit/8564df45c3a4c2c06c72107b779b4a0d9c71976a))
* 🤖 close drawer on submit ([ba8e3d8](https://github.com/s-hirano-ist/dump-to-github/commit/ba8e3d86e876703b274badcc03ba6c9bd95a675e)), closes [#195](https://github.com/s-hirano-ist/dump-to-github/issues/195)
* **deps:** update dependency @tanstack/react-table to v8.19.2 ([902497c](https://github.com/s-hirano-ist/dump-to-github/commit/902497cd4549ede174b5231434fe147d1bc771ae))
* **deps:** update dependency postcss to v8.4.39 ([f646e8e](https://github.com/s-hirano-ist/dump-to-github/commit/f646e8e435a91c8732b18c13891dca47b9a56b63))
* **deps:** update minor ([34946d0](https://github.com/s-hirano-ist/dump-to-github/commit/34946d0d492bfd64d0f0b52d463c8970c85a559e))


### リファクタリング

* 💡 add content component ([2d22ea7](https://github.com/s-hirano-ist/dump-to-github/commit/2d22ea776520af2eca300a42fdc2f1f78b5314a8))
* 💡 add public dir because of storybook fail ([125140a](https://github.com/s-hirano-ist/dump-to-github/commit/125140ab68bf84e2220ffa60649603f5219d651b))
* 💡 add typed routes ([bf60279](https://github.com/s-hirano-ist/dump-to-github/commit/bf60279f10578207d9d3e3d17565d7819979160d))
* 💡 blog and mypage ([195e58c](https://github.com/s-hirano-ist/dump-to-github/commit/195e58c3415c8f67a7e48532d36a842ece29a099))
* 💡 change dir of pages ([cb2cca5](https://github.com/s-hirano-ist/dump-to-github/commit/cb2cca5620acf7d57746baea0435842f40c95af3))
* 💡 change news detail name to blog ([d3f1e44](https://github.com/s-hirano-ist/dump-to-github/commit/d3f1e44b2c29151a05d5a7e93e498db16f9133d4))
* 💡 delete unused envs ([a5cb4bd](https://github.com/s-hirano-ist/dump-to-github/commit/a5cb4bda56c4aaa32105380f44aa0c5f9f089bb9))
* 💡 delete unused files ([2663f50](https://github.com/s-hirano-ist/dump-to-github/commit/2663f505f6bf4810b3dd124256793d9de1186d41))
* 💡 divide mypage and blog feature dir ([450a59a](https://github.com/s-hirano-ist/dump-to-github/commit/450a59a7e9e3bb28c5f0ccb8eb6ef20f61bcc813)), closes [#188](https://github.com/s-hirano-ist/dump-to-github/issues/188)
* 💡 error view ([bcb45af](https://github.com/s-hirano-ist/dump-to-github/commit/bcb45afbc039bd98c9947c8b7b561a7cfd9a4462))
* 💡 loading components ([9405c75](https://github.com/s-hirano-ist/dump-to-github/commit/9405c75138c5b182f8e877b0e8816d25dc9e7bce))
* 💡 move type declaration to types dir ([8ee2e4f](https://github.com/s-hirano-ist/dump-to-github/commit/8ee2e4fc042ef7bc65391daf8c99ee8b8798622b))
* 💡 naming of table news detail to blog ([febb731](https://github.com/s-hirano-ist/dump-to-github/commit/febb731d3e57bf833712c58558c9767930d5368a))
* 💡 no content view ([75598f9](https://github.com/s-hirano-ist/dump-to-github/commit/75598f9005157840e6933628f19caa48af595abf))
* 💡 tables ([44ae9c9](https://github.com/s-hirano-ist/dump-to-github/commit/44ae9c900a271b89e4a1f0e8ead7771a47694a15))


### CI関連

* 🎡 add vitest coverage action ([3d61e05](https://github.com/s-hirano-ist/dump-to-github/commit/3d61e0563f22520311b0494a6b1200815749cbda))
* 🎡 fix ci pull request trigger ([40bfcec](https://github.com/s-hirano-ist/dump-to-github/commit/40bfcec7c7bc457ac9c64a7e7067479ab4d28a65))


### テストの追加・修正

* 💍 add more unit tests ([3b98465](https://github.com/s-hirano-ist/dump-to-github/commit/3b9846546eb2f92ae90d990923af38e80cdda45d))
* 💍 add storybook test ([19ff081](https://github.com/s-hirano-ist/dump-to-github/commit/19ff0814749aa62ad539450473283163cb7e14b3))
* 💍 add storybook tests ([adf5f15](https://github.com/s-hirano-ist/dump-to-github/commit/adf5f154223ebc493dd8dd5e2ff84904a3240897))

### [1.0.1](https://github.com/s-hirano-ist/dump-to-github/compare/v0.0.2...v1.0.1) (2024-06-30)


### ⚠ BREAKING CHANGES

* 🧨 ]

### ドキュメント

* ✏️ update README ([28cf7ab](https://github.com/s-hirano-ist/dump-to-github/commit/28cf7ab93e67eaba24ab3272a24940f9e6c2a257))


### CI関連

* 🎡 add ci for tests ([a39b411](https://github.com/s-hirano-ist/dump-to-github/commit/a39b4114b2e7b95cd71ddf46a0fbc839829cf3dd))
* 🎡 add eslint for ci ([08aea00](https://github.com/s-hirano-ist/dump-to-github/commit/08aea002393dcc87e3cda38f629e22eaaf1971d5))
* 🎡 disable e2e test for now ([a9419d9](https://github.com/s-hirano-ist/dump-to-github/commit/a9419d96eb03a25d22d11c1de99a0ff2135067ae))
* 🎡 update env ([ddc570f](https://github.com/s-hirano-ist/dump-to-github/commit/ddc570ffb12cf15585e2e016a75bd11a7d0db85b))


### リファクタリング

* 💡 add console.log on submit ([13c7248](https://github.com/s-hirano-ist/dump-to-github/commit/13c72487a88c70c26921569e9bc2d00180c0b0a1))
* 💡 add error handling for all pages ([2d987f3](https://github.com/s-hirano-ist/dump-to-github/commit/2d987f3c3bfe7774b5130b34dbfb4a36f6c6be11))
* 💡 add recoil app provider ([6a6466b](https://github.com/s-hirano-ist/dump-to-github/commit/6a6466b958d0c728cb25b5ef2fc01f8685efdbb5))
* 💡 add vscode settings.json ([9c36fdb](https://github.com/s-hirano-ist/dump-to-github/commit/9c36fdb3f4faf50fba52279ec2137b12a4395358))
* 💡 change title of ai.json ([e0cd60a](https://github.com/s-hirano-ist/dump-to-github/commit/e0cd60a41ff32e361ea55edaa775b8104753645e))
* 💡 data args ([00ae9be](https://github.com/s-hirano-ist/dump-to-github/commit/00ae9be929e60ffbe6baa531eebb3350238ad494))
* 💡 delete submit button ([e0e655e](https://github.com/s-hirano-ist/dump-to-github/commit/e0e655e168a8138b2391710fe4790e9ffff2bdd7))
* 💡 delete unused components ([c280090](https://github.com/s-hirano-ist/dump-to-github/commit/c2800903419972a0d5340bc2340227a8fab6e9ae))
* 💡 dirs of apis and actions ([3c82f48](https://github.com/s-hirano-ist/dump-to-github/commit/3c82f48435ad0d1dea7d87d125e9340e8381a93e))
* 💡 error handling ([8d7a5d0](https://github.com/s-hirano-ist/dump-to-github/commit/8d7a5d03c2b6ed2675baf7e00340719d941af87d)), closes [#150](https://github.com/s-hirano-ist/dump-to-github/issues/150)
* 💡 fix paddings ([c30dc9e](https://github.com/s-hirano-ist/dump-to-github/commit/c30dc9ebc229d2508743b0e31cfc906d0ad82969))
* 💡 loading and others ([77fc5c8](https://github.com/s-hirano-ist/dump-to-github/commit/77fc5c8c606b7a7a402c8f04cd471f81ad4aaa32))
* 💡 metadata and types ([b9e516e](https://github.com/s-hirano-ist/dump-to-github/commit/b9e516ea9a8ec7d9e33475965490ec8ff35f9fc1))
* 💡 small refactor ([881c196](https://github.com/s-hirano-ist/dump-to-github/commit/881c1965bcc53c3817d7a45d299313c9556f8ea0))
* 💡 use as const for constants ([55b0e97](https://github.com/s-hirano-ist/dump-to-github/commit/55b0e97e7fd145aaed96c8a3fc0510ff94d343e2))


### 新機能

* 🎸 add auto pr creation ([d9be7d5](https://github.com/s-hirano-ist/dump-to-github/commit/d9be7d5104b8180d1c79b262eea4e74ca999ec5d))
* 🎸 add auto pr make ([afabb00](https://github.com/s-hirano-ist/dump-to-github/commit/afabb00cfaa6ff2f4e3e2a6af6c2fa2c58d90f71))
* 🎸 add clipboard paste button ([238a96c](https://github.com/s-hirano-ist/dump-to-github/commit/238a96cf030ed970a98dc8e1c56a69f9ed416978)), closes [#28](https://github.com/s-hirano-ist/dump-to-github/issues/28)
* 🎸 add columns to table and reset ([deeeb09](https://github.com/s-hirano-ist/dump-to-github/commit/deeeb09893854368b7fb9cb8e8da15c6c1cacb3d))
* 🎸 add database and prisma ([723e7d3](https://github.com/s-hirano-ist/dump-to-github/commit/723e7d3f4faea37e47907c4c52bdb609d886c2cc))
* 🎸 add dumpt to pr node script ([3f965d8](https://github.com/s-hirano-ist/dump-to-github/commit/3f965d86acccc22cdd633a9c1d52f4b9d9b62711))
* 🎸 add error and not found page ([0257f40](https://github.com/s-hirano-ist/dump-to-github/commit/0257f40c37610e4a5503cc91a330c8d721494f1e)), closes [#67](https://github.com/s-hirano-ist/dump-to-github/issues/67)
* 🎸 add favicon and apple-icon assets ([53fb9cc](https://github.com/s-hirano-ist/dump-to-github/commit/53fb9ccf4f2297285602301b91faebc903db50da))
* 🎸 add fonts ([b6b4a24](https://github.com/s-hirano-ist/dump-to-github/commit/b6b4a240d83fdf81eb3d013fbe89ad8fc22aca77)), closes [#55](https://github.com/s-hirano-ist/dump-to-github/issues/55)
* 🎸 add line notify ([9cc2bb8](https://github.com/s-hirano-ist/dump-to-github/commit/9cc2bb85b38c69b0022c2f6db999c2f152a3dbd7)), closes [#134](https://github.com/s-hirano-ist/dump-to-github/issues/134)
* 🎸 add skelton component ([0509b5b](https://github.com/s-hirano-ist/dump-to-github/commit/0509b5bc65c3a1cd77923d6b3649bc8549b905cc))
* 🎸 add submit and revert button ([d0cdfb1](https://github.com/s-hirano-ist/dump-to-github/commit/d0cdfb1996540ecd57e87911940351301d22a3e9))
* 🎸 add submit for toast ([5998fbd](https://github.com/s-hirano-ist/dump-to-github/commit/5998fbd6c977f683a18bc76946d23e4a2143dd34))
* 🎸 add submit page template ([7a43821](https://github.com/s-hirano-ist/dump-to-github/commit/7a43821569e82f64965a5448001681f7e8549e54))
* 🎸 add submit to database ([ee206cf](https://github.com/s-hirano-ist/dump-to-github/commit/ee206cf10024798e6005d9b507bbb06d086867e2))
* 🎸 add suspense component for button and table ([1c65586](https://github.com/s-hirano-ist/dump-to-github/commit/1c65586b90cf41317a72b628d53099bcc27abcc6))
* 🎸 add suspense for footer ([b4f2094](https://github.com/s-hirano-ist/dump-to-github/commit/b4f20943a9bc5d97810244cf6cdfc646cafe400b))
* 🎸 add table for queue ([7d2a2b1](https://github.com/s-hirano-ist/dump-to-github/commit/7d2a2b1e148c111c1b0de5d244097e23b6e1be53))
* 🎸 add table for showing all data ([98dc11b](https://github.com/s-hirano-ist/dump-to-github/commit/98dc11b783381d0e78937453366543a4a6b2f66c)), closes [#112](https://github.com/s-hirano-ist/dump-to-github/issues/112)
* 🎸 add table sort by id feature ([460683f](https://github.com/s-hirano-ist/dump-to-github/commit/460683ff0f561dad1a02a6d04cce2456ea21c44a)), closes [#50](https://github.com/s-hirano-ist/dump-to-github/issues/50)
* 🎸 add view transition api ([b0031d7](https://github.com/s-hirano-ist/dump-to-github/commit/b0031d73edd8128a1e70501a22e80169badc6d9f))
* 🎸 change table to card for main view ([90d798e](https://github.com/s-hirano-ist/dump-to-github/commit/90d798e6ec9b761b2746a8f9841fe6afdcf141c8))
* 🎸 close dialog on submit ([a5bbad0](https://github.com/s-hirano-ist/dump-to-github/commit/a5bbad0a3b556696e24379f9a021fcaeeaf8ab38))
* 🎸 introduce bottom navigation ([c424d09](https://github.com/s-hirano-ist/dump-to-github/commit/c424d0986068b790293c906e7e3e052272c631d6))
* 🎸 update table on add content ([f72d953](https://github.com/s-hirano-ist/dump-to-github/commit/f72d953b6dd6d5171f712dc4c795f4907a20520b)), closes [#68](https://github.com/s-hirano-ist/dump-to-github/issues/68)
* add category button ([731d0aa](https://github.com/s-hirano-ist/dump-to-github/commit/731d0aad5cf3826081f66fe552bf2b96bbca226d))


### バグ修正

* 🐛 bug on footer ([8267567](https://github.com/s-hirano-ist/dump-to-github/commit/8267567092f9cec1b91a0f7887d8fba679d8b115)), closes [#129](https://github.com/s-hirano-ist/dump-to-github/issues/129) [#121](https://github.com/s-hirano-ist/dump-to-github/issues/121)
* 🐛 bug on nav bar overlap with main contents ([10e791f](https://github.com/s-hirano-ist/dump-to-github/commit/10e791f0a8f1dc1bb7ddc958dc52d73894519ece)), closes [#124](https://github.com/s-hirano-ist/dump-to-github/issues/124)
* 🐛 bug on vscode biome settings ([a59aa4f](https://github.com/s-hirano-ist/dump-to-github/commit/a59aa4f9667d0dee5f178f4e7e7121ae3a5bdc84))
* 🐛 change modal direction to top ([a2ee4c0](https://github.com/s-hirano-ist/dump-to-github/commit/a2ee4c09a0290ce5f47fe915d9afc4b51c79dae8))
* 🐛 change words of error ([d298de8](https://github.com/s-hirano-ist/dump-to-github/commit/d298de894ec6bd9f0726eebf1ce0347a2cc96ee7))
* 🐛 close modal before submit done ([14a532d](https://github.com/s-hirano-ist/dump-to-github/commit/14a532d523ef463adcbc15d2fbe018df5939c887)), closes [#85](https://github.com/s-hirano-ist/dump-to-github/issues/85)
* 🐛 delete inappropriate icon ([2beafdd](https://github.com/s-hirano-ist/dump-to-github/commit/2beafdd0f9c8f7576c8d549c2bafee67f3e34a35)), closes [#115](https://github.com/s-hirano-ist/dump-to-github/issues/115)
* 🐛 delete rerender button ([e611f74](https://github.com/s-hirano-ist/dump-to-github/commit/e611f7497ca869250e2ecd77fa90cee0d3f5dd80))
* 🐛 description on env not found error ([9509591](https://github.com/s-hirano-ist/dump-to-github/commit/95095912582b7e9b34ca9c81f414698ccd8b45f9))
* 🐛 env for postgresql ([c10975d](https://github.com/s-hirano-ist/dump-to-github/commit/c10975d75a0da0b65192b03dca49f814cc85e2d8))
* 🐛 input not working on mobile devices ([3fff27d](https://github.com/s-hirano-ist/dump-to-github/commit/3fff27df977025f70c1cc97457e7d092919806c1)), closes [#52](https://github.com/s-hirano-ist/dump-to-github/issues/52)
* 🐛 key error on map ([1841d7e](https://github.com/s-hirano-ist/dump-to-github/commit/1841d7e99c2edf0f7ebe8006411fdd9a6a7a9966))
* 🐛 layout of card design ([5cd298f](https://github.com/s-hirano-ist/dump-to-github/commit/5cd298f2bed91126aac59ddc454a590a633d4c16))
* 🐛 metadata ([e4fd1ce](https://github.com/s-hirano-ist/dump-to-github/commit/e4fd1ce5ddb11f56066bc9d4a312cf3df81bd12d))
* 🐛 padding on mobile devices ([cac2a0a](https://github.com/s-hirano-ist/dump-to-github/commit/cac2a0a18cb5db704271679a775da78e1a1ff3a7)), closes [#53](https://github.com/s-hirano-ist/dump-to-github/issues/53)
* 🐛 padding on mobile devices ([2fcc0c8](https://github.com/s-hirano-ist/dump-to-github/commit/2fcc0c8965a2ebbc4ad0b3b0746b0cba891bf98c))
* 🐛 primary color ([84d2683](https://github.com/s-hirano-ist/dump-to-github/commit/84d2683031fb912ada4be4a778a51c5fc4c2a1af))
* 🐛 ssr not working on prisma fetch ([83486ee](https://github.com/s-hirano-ist/dump-to-github/commit/83486ee21d20990eff6276faaa88994755e497dd))
* 🐛 submit and drawer close order ([3d6cb22](https://github.com/s-hirano-ist/dump-to-github/commit/3d6cb2281e988e9b48cc7e0e468f842369767dd3))
* 🐛 table header index of z ([97c497c](https://github.com/s-hirano-ist/dump-to-github/commit/97c497c0de663290ae0c66af2af6964b39271283)), closes [#123](https://github.com/s-hirano-ist/dump-to-github/issues/123)
* 🐛 table layout on smartphones ([bcdb655](https://github.com/s-hirano-ist/dump-to-github/commit/bcdb655ce79f0457ab22e6d2c9e6941e4d30f491))
* 🐛 toast bug ([40bb308](https://github.com/s-hirano-ist/dump-to-github/commit/40bb3080def01cfc7a97d58ed7583ccc28873c41)), closes [#56](https://github.com/s-hirano-ist/dump-to-github/issues/56)
* 🐛 types of categories ([ee8108b](https://github.com/s-hirano-ist/dump-to-github/commit/ee8108b140da6b3ee91f47b79022c9ed6d45620c))
* 🐛 url for connecting database ([4d94f95](https://github.com/s-hirano-ist/dump-to-github/commit/4d94f95aec7945a5970f587302d1c7bbf3226e04))
* 🐛 validation and error handling ([2249497](https://github.com/s-hirano-ist/dump-to-github/commit/22494979cc60a83fa37b92b8730a64cb573e95f9)), closes [#91](https://github.com/s-hirano-ist/dump-to-github/issues/91)


### ビルドプロセスまたは補助ツールの変更

* 🤖 add analytics ([d2a1310](https://github.com/s-hirano-ist/dump-to-github/commit/d2a13109c52817429f07fadfaca0755539db5cea))
* 🤖 add assignee for renovate.json ([59dbb56](https://github.com/s-hirano-ist/dump-to-github/commit/59dbb5648f1cd147c53332d30857279a8e752226)), closes [#73](https://github.com/s-hirano-ist/dump-to-github/issues/73)
* 🤖 add eslint tailwind settings ([9b5e961](https://github.com/s-hirano-ist/dump-to-github/commit/9b5e96169745c4a8b31402b63cecbd5d1b4aadca))
* 🤖 add t3 env ([5a9e55f](https://github.com/s-hirano-ist/dump-to-github/commit/5a9e55f42721ac82a9108c57e9985d98bcfcdcc0)), closes [#34](https://github.com/s-hirano-ist/dump-to-github/issues/34)
* 🤖 change PR of minor and patch ([f25a7c5](https://github.com/s-hirano-ist/dump-to-github/commit/f25a7c53f79984d098f6ea80d083e08cdd78352b))
* 🤖 disable automerge ([754dc27](https://github.com/s-hirano-ist/dump-to-github/commit/754dc276a0849734a7f7d893b879a82fbd44b26d)), closes [#96](https://github.com/s-hirano-ist/dump-to-github/issues/96)
* 🤖 do not specify node and pnpm version on package.json ([8cf0bfb](https://github.com/s-hirano-ist/dump-to-github/commit/8cf0bfb8c151adbc142929315543d2a31799c10e))
* 🤖 small fixes on deploy ([3e7066c](https://github.com/s-hirano-ist/dump-to-github/commit/3e7066c312960dcde256d2e0afa954041f673ea5))
* 🤖 update database structure ([78d4105](https://github.com/s-hirano-ist/dump-to-github/commit/78d4105f25007fbfd67532d4f187b9b240d214c9))
* **deps:** lock file maintenance ([3ae758c](https://github.com/s-hirano-ist/dump-to-github/commit/3ae758c28f9ef1dd549d102bd2805a67e07518b6))
* **deps:** lock file maintenance ([8c93438](https://github.com/s-hirano-ist/dump-to-github/commit/8c93438fa30311a94cac9f15dbe79b5160f39b97))
* **deps:** lock file maintenance ([b90972b](https://github.com/s-hirano-ist/dump-to-github/commit/b90972b1364397dc6ab56ee590f135df20bb03ea))
* **deps:** lock file maintenance ([6bb7bee](https://github.com/s-hirano-ist/dump-to-github/commit/6bb7beed551c5da4867ffc87866913818bb2a1cd))
* **deps:** update dependency eslint to v8.57.0 ([b90f7e8](https://github.com/s-hirano-ist/dump-to-github/commit/b90f7e8d433307ae73a8a6594fb0cd626dfaf711))
* **deps:** update minor ([95698be](https://github.com/s-hirano-ist/dump-to-github/commit/95698bee4e550f652c74d8457161a8d75034af13))
* **deps:** update node.js to v20.15.0 ([96b5cb2](https://github.com/s-hirano-ist/dump-to-github/commit/96b5cb2eace4db21a6a77c61a96631c52120cdcb))
* **deps:** update patch ([148809f](https://github.com/s-hirano-ist/dump-to-github/commit/148809f9413fcc95cbebc7d585d3f3ba81e22351))
* **deps:** update patch-minor ([5097fa5](https://github.com/s-hirano-ist/dump-to-github/commit/5097fa56b8284b2fcf4ff8cc4e825b69461d6fad))
* **deps:** update patch-minor ([8bff604](https://github.com/s-hirano-ist/dump-to-github/commit/8bff604b2fa80ccb7116343c827ad212c8157bf1))
* **deps:** update patch-minor ([b7fcd6e](https://github.com/s-hirano-ist/dump-to-github/commit/b7fcd6e7713e045a8cd4fadbaddc5c143dba4af9))
* **deps:** update patch-minor ([e07779b](https://github.com/s-hirano-ist/dump-to-github/commit/e07779b915c0bcd1c917302ec323d2c0da0830a9))
* **release:** 🏹1.0.0 ([20cc066](https://github.com/s-hirano-ist/dump-to-github/commit/20cc06609322ff77b29aedba961441da2b5ad1b6))


### テストの追加・修正

* 💍 add unit tests ([eaff7bf](https://github.com/s-hirano-ist/dump-to-github/commit/eaff7bf0b14525b47f31f9788087978891b45ff8)), closes [#9](https://github.com/s-hirano-ist/dump-to-github/issues/9)
* 💍 add vitest ([a34e734](https://github.com/s-hirano-ist/dump-to-github/commit/a34e73444b3811a3be4a8598392afa50ee2f9d34)), closes [#5](https://github.com/s-hirano-ist/dump-to-github/issues/5)
* 💍 introduce playwright test ([3daa55d](https://github.com/s-hirano-ist/dump-to-github/commit/3daa55d6a2e3c4309f1174cbf363d787d8bbbb53)), closes [#6](https://github.com/s-hirano-ist/dump-to-github/issues/6)

## [1.0.0](https://github.com/s-hirano-ist/dump-to-github/compare/v0.0.2...v1.0.0) (2024-06-30)


### ⚠ BREAKING CHANGES

* 🧨 ]

### ドキュメント

* ✏️ update README ([28cf7ab](https://github.com/s-hirano-ist/dump-to-github/commit/28cf7ab93e67eaba24ab3272a24940f9e6c2a257))


### テストの追加・修正

* 💍 add vitest ([a34e734](https://github.com/s-hirano-ist/dump-to-github/commit/a34e73444b3811a3be4a8598392afa50ee2f9d34)), closes [#5](https://github.com/s-hirano-ist/dump-to-github/issues/5)
* 💍 introduce playwright test ([3daa55d](https://github.com/s-hirano-ist/dump-to-github/commit/3daa55d6a2e3c4309f1174cbf363d787d8bbbb53)), closes [#6](https://github.com/s-hirano-ist/dump-to-github/issues/6)


### CI関連

* 🎡 add ci for tests ([a39b411](https://github.com/s-hirano-ist/dump-to-github/commit/a39b4114b2e7b95cd71ddf46a0fbc839829cf3dd))
* 🎡 add eslint for ci ([08aea00](https://github.com/s-hirano-ist/dump-to-github/commit/08aea002393dcc87e3cda38f629e22eaaf1971d5))
* 🎡 disable e2e test for now ([a9419d9](https://github.com/s-hirano-ist/dump-to-github/commit/a9419d96eb03a25d22d11c1de99a0ff2135067ae))
* 🎡 update env ([ddc570f](https://github.com/s-hirano-ist/dump-to-github/commit/ddc570ffb12cf15585e2e016a75bd11a7d0db85b))


### リファクタリング

* 💡 add console.log on submit ([13c7248](https://github.com/s-hirano-ist/dump-to-github/commit/13c72487a88c70c26921569e9bc2d00180c0b0a1))
* 💡 add error handling for all pages ([2d987f3](https://github.com/s-hirano-ist/dump-to-github/commit/2d987f3c3bfe7774b5130b34dbfb4a36f6c6be11))
* 💡 add recoil app provider ([6a6466b](https://github.com/s-hirano-ist/dump-to-github/commit/6a6466b958d0c728cb25b5ef2fc01f8685efdbb5))
* 💡 add vscode settings.json ([9c36fdb](https://github.com/s-hirano-ist/dump-to-github/commit/9c36fdb3f4faf50fba52279ec2137b12a4395358))
* 💡 change title of ai.json ([e0cd60a](https://github.com/s-hirano-ist/dump-to-github/commit/e0cd60a41ff32e361ea55edaa775b8104753645e))
* 💡 data args ([00ae9be](https://github.com/s-hirano-ist/dump-to-github/commit/00ae9be929e60ffbe6baa531eebb3350238ad494))
* 💡 delete submit button ([e0e655e](https://github.com/s-hirano-ist/dump-to-github/commit/e0e655e168a8138b2391710fe4790e9ffff2bdd7))
* 💡 delete unused components ([c280090](https://github.com/s-hirano-ist/dump-to-github/commit/c2800903419972a0d5340bc2340227a8fab6e9ae))
* 💡 dirs of apis and actions ([3c82f48](https://github.com/s-hirano-ist/dump-to-github/commit/3c82f48435ad0d1dea7d87d125e9340e8381a93e))
* 💡 error handling ([8d7a5d0](https://github.com/s-hirano-ist/dump-to-github/commit/8d7a5d03c2b6ed2675baf7e00340719d941af87d)), closes [#150](https://github.com/s-hirano-ist/dump-to-github/issues/150)
* 💡 fix paddings ([c30dc9e](https://github.com/s-hirano-ist/dump-to-github/commit/c30dc9ebc229d2508743b0e31cfc906d0ad82969))
* 💡 loading and others ([77fc5c8](https://github.com/s-hirano-ist/dump-to-github/commit/77fc5c8c606b7a7a402c8f04cd471f81ad4aaa32))
* 💡 metadata and types ([b9e516e](https://github.com/s-hirano-ist/dump-to-github/commit/b9e516ea9a8ec7d9e33475965490ec8ff35f9fc1))
* 💡 small refactor ([881c196](https://github.com/s-hirano-ist/dump-to-github/commit/881c1965bcc53c3817d7a45d299313c9556f8ea0))
* 💡 use as const for constants ([55b0e97](https://github.com/s-hirano-ist/dump-to-github/commit/55b0e97e7fd145aaed96c8a3fc0510ff94d343e2))


### 新機能

* 🎸 add auto pr creation ([d9be7d5](https://github.com/s-hirano-ist/dump-to-github/commit/d9be7d5104b8180d1c79b262eea4e74ca999ec5d))
* 🎸 add auto pr make ([afabb00](https://github.com/s-hirano-ist/dump-to-github/commit/afabb00cfaa6ff2f4e3e2a6af6c2fa2c58d90f71))
* 🎸 add clipboard paste button ([238a96c](https://github.com/s-hirano-ist/dump-to-github/commit/238a96cf030ed970a98dc8e1c56a69f9ed416978)), closes [#28](https://github.com/s-hirano-ist/dump-to-github/issues/28)
* 🎸 add columns to table and reset ([deeeb09](https://github.com/s-hirano-ist/dump-to-github/commit/deeeb09893854368b7fb9cb8e8da15c6c1cacb3d))
* 🎸 add database and prisma ([723e7d3](https://github.com/s-hirano-ist/dump-to-github/commit/723e7d3f4faea37e47907c4c52bdb609d886c2cc))
* 🎸 add dumpt to pr node script ([3f965d8](https://github.com/s-hirano-ist/dump-to-github/commit/3f965d86acccc22cdd633a9c1d52f4b9d9b62711))
* 🎸 add error and not found page ([0257f40](https://github.com/s-hirano-ist/dump-to-github/commit/0257f40c37610e4a5503cc91a330c8d721494f1e)), closes [#67](https://github.com/s-hirano-ist/dump-to-github/issues/67)
* 🎸 add favicon and apple-icon assets ([53fb9cc](https://github.com/s-hirano-ist/dump-to-github/commit/53fb9ccf4f2297285602301b91faebc903db50da))
* 🎸 add fonts ([b6b4a24](https://github.com/s-hirano-ist/dump-to-github/commit/b6b4a240d83fdf81eb3d013fbe89ad8fc22aca77)), closes [#55](https://github.com/s-hirano-ist/dump-to-github/issues/55)
* 🎸 add line notify ([9cc2bb8](https://github.com/s-hirano-ist/dump-to-github/commit/9cc2bb85b38c69b0022c2f6db999c2f152a3dbd7)), closes [#134](https://github.com/s-hirano-ist/dump-to-github/issues/134)
* 🎸 add skelton component ([0509b5b](https://github.com/s-hirano-ist/dump-to-github/commit/0509b5bc65c3a1cd77923d6b3649bc8549b905cc))
* 🎸 add submit and revert button ([d0cdfb1](https://github.com/s-hirano-ist/dump-to-github/commit/d0cdfb1996540ecd57e87911940351301d22a3e9))
* 🎸 add submit for toast ([5998fbd](https://github.com/s-hirano-ist/dump-to-github/commit/5998fbd6c977f683a18bc76946d23e4a2143dd34))
* 🎸 add submit page template ([7a43821](https://github.com/s-hirano-ist/dump-to-github/commit/7a43821569e82f64965a5448001681f7e8549e54))
* 🎸 add submit to database ([ee206cf](https://github.com/s-hirano-ist/dump-to-github/commit/ee206cf10024798e6005d9b507bbb06d086867e2))
* 🎸 add suspense component for button and table ([1c65586](https://github.com/s-hirano-ist/dump-to-github/commit/1c65586b90cf41317a72b628d53099bcc27abcc6))
* 🎸 add suspense for footer ([b4f2094](https://github.com/s-hirano-ist/dump-to-github/commit/b4f20943a9bc5d97810244cf6cdfc646cafe400b))
* 🎸 add table for queue ([7d2a2b1](https://github.com/s-hirano-ist/dump-to-github/commit/7d2a2b1e148c111c1b0de5d244097e23b6e1be53))
* 🎸 add table for showing all data ([98dc11b](https://github.com/s-hirano-ist/dump-to-github/commit/98dc11b783381d0e78937453366543a4a6b2f66c)), closes [#112](https://github.com/s-hirano-ist/dump-to-github/issues/112)
* 🎸 add table sort by id feature ([460683f](https://github.com/s-hirano-ist/dump-to-github/commit/460683ff0f561dad1a02a6d04cce2456ea21c44a)), closes [#50](https://github.com/s-hirano-ist/dump-to-github/issues/50)
* 🎸 add view transition api ([b0031d7](https://github.com/s-hirano-ist/dump-to-github/commit/b0031d73edd8128a1e70501a22e80169badc6d9f))
* 🎸 change table to card for main view ([90d798e](https://github.com/s-hirano-ist/dump-to-github/commit/90d798e6ec9b761b2746a8f9841fe6afdcf141c8))
* 🎸 close dialog on submit ([a5bbad0](https://github.com/s-hirano-ist/dump-to-github/commit/a5bbad0a3b556696e24379f9a021fcaeeaf8ab38))
* 🎸 introduce bottom navigation ([c424d09](https://github.com/s-hirano-ist/dump-to-github/commit/c424d0986068b790293c906e7e3e052272c631d6))
* 🎸 update table on add content ([f72d953](https://github.com/s-hirano-ist/dump-to-github/commit/f72d953b6dd6d5171f712dc4c795f4907a20520b)), closes [#68](https://github.com/s-hirano-ist/dump-to-github/issues/68)
* add category button ([731d0aa](https://github.com/s-hirano-ist/dump-to-github/commit/731d0aad5cf3826081f66fe552bf2b96bbca226d))


### バグ修正

* 🐛 bug on footer ([8267567](https://github.com/s-hirano-ist/dump-to-github/commit/8267567092f9cec1b91a0f7887d8fba679d8b115)), closes [#129](https://github.com/s-hirano-ist/dump-to-github/issues/129) [#121](https://github.com/s-hirano-ist/dump-to-github/issues/121)
* 🐛 bug on nav bar overlap with main contents ([10e791f](https://github.com/s-hirano-ist/dump-to-github/commit/10e791f0a8f1dc1bb7ddc958dc52d73894519ece)), closes [#124](https://github.com/s-hirano-ist/dump-to-github/issues/124)
* 🐛 bug on vscode biome settings ([a59aa4f](https://github.com/s-hirano-ist/dump-to-github/commit/a59aa4f9667d0dee5f178f4e7e7121ae3a5bdc84))
* 🐛 change modal direction to top ([a2ee4c0](https://github.com/s-hirano-ist/dump-to-github/commit/a2ee4c09a0290ce5f47fe915d9afc4b51c79dae8))
* 🐛 change words of error ([d298de8](https://github.com/s-hirano-ist/dump-to-github/commit/d298de894ec6bd9f0726eebf1ce0347a2cc96ee7))
* 🐛 close modal before submit done ([14a532d](https://github.com/s-hirano-ist/dump-to-github/commit/14a532d523ef463adcbc15d2fbe018df5939c887)), closes [#85](https://github.com/s-hirano-ist/dump-to-github/issues/85)
* 🐛 delete inappropriate icon ([2beafdd](https://github.com/s-hirano-ist/dump-to-github/commit/2beafdd0f9c8f7576c8d549c2bafee67f3e34a35)), closes [#115](https://github.com/s-hirano-ist/dump-to-github/issues/115)
* 🐛 delete rerender button ([e611f74](https://github.com/s-hirano-ist/dump-to-github/commit/e611f7497ca869250e2ecd77fa90cee0d3f5dd80))
* 🐛 description on env not found error ([9509591](https://github.com/s-hirano-ist/dump-to-github/commit/95095912582b7e9b34ca9c81f414698ccd8b45f9))
* 🐛 env for postgresql ([c10975d](https://github.com/s-hirano-ist/dump-to-github/commit/c10975d75a0da0b65192b03dca49f814cc85e2d8))
* 🐛 input not working on mobile devices ([3fff27d](https://github.com/s-hirano-ist/dump-to-github/commit/3fff27df977025f70c1cc97457e7d092919806c1)), closes [#52](https://github.com/s-hirano-ist/dump-to-github/issues/52)
* 🐛 key error on map ([1841d7e](https://github.com/s-hirano-ist/dump-to-github/commit/1841d7e99c2edf0f7ebe8006411fdd9a6a7a9966))
* 🐛 layout of card design ([5cd298f](https://github.com/s-hirano-ist/dump-to-github/commit/5cd298f2bed91126aac59ddc454a590a633d4c16))
* 🐛 metadata ([e4fd1ce](https://github.com/s-hirano-ist/dump-to-github/commit/e4fd1ce5ddb11f56066bc9d4a312cf3df81bd12d))
* 🐛 padding on mobile devices ([cac2a0a](https://github.com/s-hirano-ist/dump-to-github/commit/cac2a0a18cb5db704271679a775da78e1a1ff3a7)), closes [#53](https://github.com/s-hirano-ist/dump-to-github/issues/53)
* 🐛 padding on mobile devices ([2fcc0c8](https://github.com/s-hirano-ist/dump-to-github/commit/2fcc0c8965a2ebbc4ad0b3b0746b0cba891bf98c))
* 🐛 primary color ([84d2683](https://github.com/s-hirano-ist/dump-to-github/commit/84d2683031fb912ada4be4a778a51c5fc4c2a1af))
* 🐛 ssr not working on prisma fetch ([83486ee](https://github.com/s-hirano-ist/dump-to-github/commit/83486ee21d20990eff6276faaa88994755e497dd))
* 🐛 submit and drawer close order ([3d6cb22](https://github.com/s-hirano-ist/dump-to-github/commit/3d6cb2281e988e9b48cc7e0e468f842369767dd3))
* 🐛 table header index of z ([97c497c](https://github.com/s-hirano-ist/dump-to-github/commit/97c497c0de663290ae0c66af2af6964b39271283)), closes [#123](https://github.com/s-hirano-ist/dump-to-github/issues/123)
* 🐛 table layout on smartphones ([bcdb655](https://github.com/s-hirano-ist/dump-to-github/commit/bcdb655ce79f0457ab22e6d2c9e6941e4d30f491))
* 🐛 toast bug ([40bb308](https://github.com/s-hirano-ist/dump-to-github/commit/40bb3080def01cfc7a97d58ed7583ccc28873c41)), closes [#56](https://github.com/s-hirano-ist/dump-to-github/issues/56)
* 🐛 types of categories ([ee8108b](https://github.com/s-hirano-ist/dump-to-github/commit/ee8108b140da6b3ee91f47b79022c9ed6d45620c))
* 🐛 url for connecting database ([4d94f95](https://github.com/s-hirano-ist/dump-to-github/commit/4d94f95aec7945a5970f587302d1c7bbf3226e04))
* 🐛 validation and error handling ([2249497](https://github.com/s-hirano-ist/dump-to-github/commit/22494979cc60a83fa37b92b8730a64cb573e95f9)), closes [#91](https://github.com/s-hirano-ist/dump-to-github/issues/91)


### ビルドプロセスまたは補助ツールの変更

* 🤖 add analytics ([d2a1310](https://github.com/s-hirano-ist/dump-to-github/commit/d2a13109c52817429f07fadfaca0755539db5cea))
* 🤖 add assignee for renovate.json ([59dbb56](https://github.com/s-hirano-ist/dump-to-github/commit/59dbb5648f1cd147c53332d30857279a8e752226)), closes [#73](https://github.com/s-hirano-ist/dump-to-github/issues/73)
* 🤖 add eslint tailwind settings ([9b5e961](https://github.com/s-hirano-ist/dump-to-github/commit/9b5e96169745c4a8b31402b63cecbd5d1b4aadca))
* 🤖 add t3 env ([5a9e55f](https://github.com/s-hirano-ist/dump-to-github/commit/5a9e55f42721ac82a9108c57e9985d98bcfcdcc0)), closes [#34](https://github.com/s-hirano-ist/dump-to-github/issues/34)
* 🤖 change PR of minor and patch ([f25a7c5](https://github.com/s-hirano-ist/dump-to-github/commit/f25a7c53f79984d098f6ea80d083e08cdd78352b))
* 🤖 disable automerge ([754dc27](https://github.com/s-hirano-ist/dump-to-github/commit/754dc276a0849734a7f7d893b879a82fbd44b26d)), closes [#96](https://github.com/s-hirano-ist/dump-to-github/issues/96)
* 🤖 do not specify node and pnpm version on package.json ([8cf0bfb](https://github.com/s-hirano-ist/dump-to-github/commit/8cf0bfb8c151adbc142929315543d2a31799c10e))
* 🤖 small fixes on deploy ([3e7066c](https://github.com/s-hirano-ist/dump-to-github/commit/3e7066c312960dcde256d2e0afa954041f673ea5))
* 🤖 update database structure ([78d4105](https://github.com/s-hirano-ist/dump-to-github/commit/78d4105f25007fbfd67532d4f187b9b240d214c9))
* **deps:** lock file maintenance ([3ae758c](https://github.com/s-hirano-ist/dump-to-github/commit/3ae758c28f9ef1dd549d102bd2805a67e07518b6))
* **deps:** lock file maintenance ([8c93438](https://github.com/s-hirano-ist/dump-to-github/commit/8c93438fa30311a94cac9f15dbe79b5160f39b97))
* **deps:** lock file maintenance ([b90972b](https://github.com/s-hirano-ist/dump-to-github/commit/b90972b1364397dc6ab56ee590f135df20bb03ea))
* **deps:** lock file maintenance ([6bb7bee](https://github.com/s-hirano-ist/dump-to-github/commit/6bb7beed551c5da4867ffc87866913818bb2a1cd))
* **deps:** update dependency eslint to v8.57.0 ([b90f7e8](https://github.com/s-hirano-ist/dump-to-github/commit/b90f7e8d433307ae73a8a6594fb0cd626dfaf711))
* **deps:** update minor ([95698be](https://github.com/s-hirano-ist/dump-to-github/commit/95698bee4e550f652c74d8457161a8d75034af13))
* **deps:** update node.js to v20.15.0 ([96b5cb2](https://github.com/s-hirano-ist/dump-to-github/commit/96b5cb2eace4db21a6a77c61a96631c52120cdcb))
* **deps:** update patch ([148809f](https://github.com/s-hirano-ist/dump-to-github/commit/148809f9413fcc95cbebc7d585d3f3ba81e22351))
* **deps:** update patch-minor ([5097fa5](https://github.com/s-hirano-ist/dump-to-github/commit/5097fa56b8284b2fcf4ff8cc4e825b69461d6fad))
* **deps:** update patch-minor ([8bff604](https://github.com/s-hirano-ist/dump-to-github/commit/8bff604b2fa80ccb7116343c827ad212c8157bf1))
* **deps:** update patch-minor ([b7fcd6e](https://github.com/s-hirano-ist/dump-to-github/commit/b7fcd6e7713e045a8cd4fadbaddc5c143dba4af9))
* **deps:** update patch-minor ([e07779b](https://github.com/s-hirano-ist/dump-to-github/commit/e07779b915c0bcd1c917302ec323d2c0da0830a9))

### 0.0.2 (2024-06-08)


### リファクタリング

* page.tsx ([30a97ef](https://github.com/s-hirano-ist/dump-to-github/commit/30a97ef160d83058e36eb3a3a0d60498d38f8a69))


### CI関連

* add ci for biome ([#35](https://github.com/s-hirano-ist/dump-to-github/issues/35)) ([af0a596](https://github.com/s-hirano-ist/dump-to-github/commit/af0a59665700fc9e62cb26c791a597d195be9bae))


### 新機能

* add shadcn ui ([735ec2e](https://github.com/s-hirano-ist/dump-to-github/commit/735ec2ebd58abb7a360e72c3afddc6b6887b0942))
* add table shadcn ui component ([5083c8c](https://github.com/s-hirano-ist/dump-to-github/commit/5083c8c10d7c0c029ed45b3ce4bb6f57940dbacc))
* add toast for submit ([#38](https://github.com/s-hirano-ist/dump-to-github/issues/38)) ([76f0d4d](https://github.com/s-hirano-ist/dump-to-github/commit/76f0d4d41d01b8b8d93b33c202394a1879dbdde0))
* add ui for dialog drawer and input ([#31](https://github.com/s-hirano-ist/dump-to-github/issues/31)) ([4973cd4](https://github.com/s-hirano-ist/dump-to-github/commit/4973cd461e71195802afcb551cb60ca85a521bb8))
* initial commit ([041e197](https://github.com/s-hirano-ist/dump-to-github/commit/041e197cac1d09dc242d44575d3858a6df03ad63))
* introduce tailwindcss ([bd97354](https://github.com/s-hirano-ist/dump-to-github/commit/bd973541094d1920194dba21e9e784ff3bca9348))


### バグ修正

* lockfile ([5dca407](https://github.com/s-hirano-ist/dump-to-github/commit/5dca407e6d24bb81d8f776e12758877bf1fa1575))


### ビルドプロセスまたは補助ツールの変更

* 🤖 refactor changelog.config.js ([0db7e3d](https://github.com/s-hirano-ist/dump-to-github/commit/0db7e3d295018bbaed707eb5698248ffd38b3820))
* add eslint ([534856a](https://github.com/s-hirano-ist/dump-to-github/commit/534856acb569898bc6c655b659ab362c4ac3f435))
* add npm nvm rc ([a8077bb](https://github.com/s-hirano-ist/dump-to-github/commit/a8077bb47aa8e6cbd13ebd3df6c95e01cfa31f3a))
* add renovate ([13879a1](https://github.com/s-hirano-ist/dump-to-github/commit/13879a193028f8b8128a203aaf1646377e998bb2))
* add temporary build script ([e3143b4](https://github.com/s-hirano-ist/dump-to-github/commit/e3143b45c764296b748b541fa612a16e8fae8533))
* add vscode settings ([4197671](https://github.com/s-hirano-ist/dump-to-github/commit/419767191546f9fabfff4d505d44574f0efcc59a))
* **deps:** lock file maintenance ([#20](https://github.com/s-hirano-ist/dump-to-github/issues/20)) ([2622b17](https://github.com/s-hirano-ist/dump-to-github/commit/2622b17fb96d8a79ce835d19c9ae308af2aeb1df))
* **deps:** lock file maintenance ([#37](https://github.com/s-hirano-ist/dump-to-github/issues/37)) ([cd7b014](https://github.com/s-hirano-ist/dump-to-github/commit/cd7b0144e1b533132be49bc59bbae118a82e133f))
* **deps:** update dependency eslint to v9 ([#19](https://github.com/s-hirano-ist/dump-to-github/issues/19)) ([68dbd49](https://github.com/s-hirano-ist/dump-to-github/commit/68dbd493a26a041fb108809dbc7956a8a64c6cc9))
* **deps:** update node.js to v20.14.0 ([#17](https://github.com/s-hirano-ist/dump-to-github/issues/17)) ([7e4a936](https://github.com/s-hirano-ist/dump-to-github/commit/7e4a936d95b06cc8a9a21b5af09a5681f8c3f32d))
* **deps:** update patch-minor ([#18](https://github.com/s-hirano-ist/dump-to-github/issues/18)) ([9abb579](https://github.com/s-hirano-ist/dump-to-github/commit/9abb5790c968b49cd2fe7320a88505a82b7224e6))
* **deps:** update patch-minor ([#36](https://github.com/s-hirano-ist/dump-to-github/issues/36)) ([3223d27](https://github.com/s-hirano-ist/dump-to-github/commit/3223d2704956b1ef6d5e281655370aadc963ff4b))
* introduce biome ([23f1212](https://github.com/s-hirano-ist/dump-to-github/commit/23f1212015aac11d79efa285ddca9fbff6cb3dde))
* refactoring ([#39](https://github.com/s-hirano-ist/dump-to-github/issues/39)) ([e3fe917](https://github.com/s-hirano-ist/dump-to-github/commit/e3fe917f36af156a20d6707ffce9b300e81ebc8e))
* update pnpm ([0693128](https://github.com/s-hirano-ist/dump-to-github/commit/0693128c5a70d864196b3d8a8d12b0e9d0e49d36))
* **無し:** 🤖 add git-cz and standard-version ([3383ee1](https://github.com/s-hirano-ist/dump-to-github/commit/3383ee13a4503ba87c69875c97757b09786ef6de))
* **無し:** 🤖 add words to dict ([7b97fc1](https://github.com/s-hirano-ist/dump-to-github/commit/7b97fc170668e45247179aa5bf30cbda01f9231e))
