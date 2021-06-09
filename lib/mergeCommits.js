const cp = require("child_process");

const commitRegex = /^(\w+) (.*)$/;

function getMergeCommits(base, branch) {
  cp.execSync(`git fetch origin ${base}`);
  cp.execSync(`git fetch origin ${branch}`);

  const output = cp.execSync(
    `git log origin/${base}...origin/${branch} --merges --first-parent --oneline`
  );

  const commits = output
    .toString()
    .split("\n")
    .map((line) => {
      const matches = line.match(commitRegex);

      return matches !== null ? matches[1] : null;
    })
    .filter(Boolean);

  return commits;
}

module.exports = {
  getMergeCommits,
};
