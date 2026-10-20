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

7. Run the "Publish npm package and create release" workflow (Actions tab, `main` branch) with `version` set to the new version (e.g. `v1.0.2`). Run it once with `dry_run` checked, then again unchecked. It publishes to npm (pre-release versions go to the `next` dist-tag) and creates the `v1.0.2` tag and GitHub Release.
