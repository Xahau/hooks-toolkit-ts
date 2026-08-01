# Hooks-Toolkit Release Process

## Cutting a Release

The full process for cutting a release is as follows:

0. Checkout a new branch:
   `git checkout -b v1.0.2` # 1.0.2-release

2. Change the version in the package.json file:
   `"version": "1.0.2",`

3. Add, and commit the changes, push up the branch, and open a PR:
   `git add .`
   `git commit -m 'RELEASE v1.0.2'`
   `git push --set-upstream origin HEAD`

4. Open PR request

   ``

5. Once the PR is merged, checkout the `main` branch:
   `git checkout main`

6. Delete `main` branch (Optional):
   `git branch -d v1.0.2`

7. Make a new Git tag that matches the new version (make sure it is associated with the right commit SHA): FIXUP
   `git tag -a v1.0.2 -m "cut v1.0.2"`

8. Push up the tag from `main`:
   `git push origin v1.0.2`

## Packaging & Releasing

Update pnpm build

`pnpm run build`

Publish

`npm publish --access public`

## Publishing New Docker Images

1. `xrpld-netgen up:standalone --version=2024.7.17-jshooks+933`

2. `docker tag xahau-2024717-jshooks933-xahau transia/xahaudjs`

3. `docker push transia/xahaudjs`
