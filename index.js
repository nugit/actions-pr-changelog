const core = require('@actions/core');
const github = require('@actions/github');

// exit early
if (!['pull_request_target', 'pull_request'].includes(github.context.eventName)) {
  core.setFailed('action triggered outside of a pull_request')
  process.exit(1)
}

try {
  const { repo, payload: { number } } = github.context;
  console.log(repo, number)
  core.info(`Yah`);
} catch (error) {
  core.setFailed(error.message);
}
