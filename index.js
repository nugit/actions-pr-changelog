const core = require('@actions/core');
const github = require('@actions/github');
const { updateReleasePR } = require('./lib/pr');

async function run () {
  // exit early
  if (!['pull_request_target', 'pull_request'].includes(github.context.eventName)) {
    core.setFailed('action triggered outside of a pull_request')
    process.exit(1)
  }
  core.debug(`github.context: ${JSON.stringify(github.context, null, 2)}`);
  
  try {
    const { payload: { number, repository: { name, owner: { login }} } } = github.context;
    const token = core.getInput('token');
    const octokit = github.getOctokit(token);

    const type = core.getInput('type', { required: true });
    switch(type) {
      case 'release':
        await updateReleasePR(octokit, login, name, number);
        break;
      case 'onprem':
        core.setFailed('Not supported yet');
        break;
      default:
        core.setFailed('Invalid type input');
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
