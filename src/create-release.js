const core = require("@actions/core");
const github = require("@actions/github");
const fs = require("fs");

async function run() {
  try {
    // Get authenticated GitHub client (Octokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
    const gh = github.getOctokit(
      core.getInput("github-token", { required: true }),
    );

    const context = github.context;
    // Get owner and repo from context of payload that triggered the action
    const { owner: currentOwner, repo: currentRepo } = context.repo;

    // Get the inputs from the workflow file: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    const tagName = core.getInput("tag_name", { required: true });
    const tag = tagName.replace("refs/tags/", "");
    const releaseName = core
      .getInput("release_name", { required: false })
      .replace("refs/tags/", "");
    const body = core.getInput("body", { required: false });
    const draft = core.getInput("draft", { required: false }) === "true";
    const prerelease =
      core.getInput("prerelease", { required: false }) === "true";
    const generate_release_notes =
      core.getInput("generate_release_notes", { required: false }) === "true";
    const discussion_category_name = core.getInput("discussion_category_name", {
      required: false,
    });
    const make_latest =
      core.getInput("make_latest", { required: false }) === "true";
    const commitish =
      core.getInput("commitish", { required: false }) || context.sha;

    const bodyPath = core.getInput("body_path", { required: false });
    const owner = core.getInput("owner", { required: false }) || currentOwner;
    const repo = core.getInput("repo", { required: false }) || currentRepo;
    let bodyFileContent = null;
    if (bodyPath !== "" && !!bodyPath) {
      try {
        bodyFileContent = fs.readFileSync(bodyPath, { encoding: "utf8" });
      } catch (error) {
        core.setFailed(error.message);
      }
    }

    // Create a release
    // API Documentation: https://developer.github.com/v3/repos/releases/#create-a-release
    // Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-create-release
    const createReleaseResponse = await gh.rest.repos.createRelease({
      owner,
      repo,
      tag_name: tag,
      target_commitish: commitish,
      name: releaseName,
      body: bodyFileContent || body,
      draft,
      prerelease,
      discussion_category_name,
      generate_release_notes,
      make_latest,
    });

    // Get the ID, html_url, and upload URL for the created Release from the response
    const {
      data: { id: releaseId, html_url: htmlUrl, upload_url: uploadUrl },
    } = createReleaseResponse;

    // Set the output variables for use by other actions: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    core.setOutput("id", releaseId);
    core.setOutput("html_url", htmlUrl);
    core.setOutput("upload_url", uploadUrl);
  } catch (error) {
    core.setFailed(error.message);
  }
}

module.exports = { run };
