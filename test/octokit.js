const github = require('@actions/github');
const dotenv = require('dotenv');

dotenv.config({ path: `${__dirname}/../.secrets` });

const octokit = github.getOctokit(process.env.GITHUB_TOKEN, {
  throttle: {
    onRateLimit: (retryAfter, options, kit) => {
      kit.log.warn(
        `Request quota exhausted for request ${options.method} ${options.url}`,
      );

      if (options.request.retryCount === 0) {
        // only retries once
        kit.log.info(`Retrying after ${retryAfter} seconds!`);
        return true;
      }

      return false;
    },
    onAbuseLimit: (retryAfter, options, kit) => {
      // does not retry, only logs a warning
      kit.log.warn(
        `Abuse detected for request ${options.method} ${options.url}`,
      );
    },
  },
});

module.exports = {
  octokit,
};
