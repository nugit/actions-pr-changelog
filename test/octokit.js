const dotenv = require("dotenv");
const github = require('@actions/github');

dotenv.config({ path: `${__dirname}/../.secrets` });

const octokit = github.getOctokit(process.env.GITHUB_TOKEN);

module.exports = {
  octokit,
};
