// Cross environment script to update all package.json versions in a monorepo
// A port of the following bash script:
// npm version $npm_package_version --workspaces --git-tag-version false --ignore-scripts && git add '**/package.json'

import { execSync } from 'node:child_process';

const packages = ['tanstack-query-builder', 'tanstack-query-builder-example-mocks'];

const version = process.env.npm_package_version;
const cwd = process.cwd();

execSync(`npm version ${version} --workspaces --git-tag-version false --ignore-scripts`, { cwd });
execSync(`npm update --save --workspaces ${packages.join(' ')}`, { cwd });
execSync(`git add "**/package.json"`, { cwd });
