const path = require('path');
const { dasherize } = require('../../../utils/slugs');
const { sortChallengeFiles } = require('../../../utils/sort-challengefiles');
const { challengeTypes, viewTypes } = require('../challenge-types');

const backend = path.resolve(
  __dirname,
  '../../src/templates/Challenges/projects/backend/Show.tsx'
);
const classic = path.resolve(
  __dirname,
  '../../src/templates/Challenges/classic/show.tsx'
);
const frontend = path.resolve(
  __dirname,
  '../../src/templates/Challenges/projects/frontend/Show.tsx'
);
const codeally = path.resolve(
  __dirname,
  '../../src/templates/Challenges/codeally/show.tsx'
);
const intro = path.resolve(
  __dirname,
  '../../src/templates/Introduction/intro.tsx'
);
const superBlockIntro = path.resolve(
  __dirname,
  '../../src/templates/Introduction/super-block-intro.tsx'
);
const video = path.resolve(
  __dirname,
  '../../src/templates/Challenges/video/Show.tsx'
);

const views = {
  backend,
  classic,
  modern: classic,
  frontend,
  video,
  codeally
  // quiz: Quiz
};

function getNextChallengePath(_node, index, nodeArray) {
  const next = nodeArray[index + 1];
  return next ? next.node.challenge.fields.slug : '/learn';
}

function getPrevChallengePath(_node, index, nodeArray) {
  const prev = nodeArray[index - 1];
  return prev ? prev.node.challenge.fields.slug : '/learn';
}

function getTemplateComponent(challengeType) {
  return views[viewTypes[challengeType]];
}

exports.createChallengePages = function (createPage) {
  return function ({ node: { challenge } }, index, allChallengeEdges) {
    const {
      certification,
      superBlock,
      block,
      fields: { slug },
      required = [],
      template,
      challengeType,
      id
    } = challenge;
    // TODO: challengeType === 7 and isPrivate are the same, right? If so, we
    // should remove one of them.

    createPage({
      path: slug,
      component: getTemplateComponent(challengeType),
      context: {
        challengeMeta: {
          certification,
          superBlock,
          block,
          template,
          required,
          nextChallengePath: getNextChallengePath(
            challenge,
            index,
            allChallengeEdges
          ),
          prevChallengePath: getPrevChallengePath(
            challenge,
            index,
            allChallengeEdges
          ),
          id
        },
        projectPreview: getProjectPreviewConfig(challenge, allChallengeEdges),
        slug
      }
    });
  };
};

function getProjectPreviewConfig(challenge, allChallengeEdges) {
  const { block, challengeOrder, challengeType, usesMultifileEditor } =
    challenge;

  const challengesInBlock = allChallengeEdges
    .filter(({ node: { challenge } }) => challenge.block === block)
    .map(({ node: { challenge } }) => challenge);
  const lastChallenge = challengesInBlock[challengesInBlock.length - 1];
  const solutionToLastChallenge = sortChallengeFiles(
    lastChallenge.solutions[0] ?? []
  );
  const lastChallengeFiles = sortChallengeFiles(
    lastChallenge.challengeFiles ?? []
  );
  const projectPreviewChallengeFiles = lastChallengeFiles.map((file, id) => ({
    ...file,
    contents: solutionToLastChallenge[id]?.contents ?? file.contents
  }));

  return {
    showProjectPreview:
      challengeOrder === 0 &&
      usesMultifileEditor &&
      challengeType !== challengeTypes.multiFileCertProject,
    challengeData: {
      challengeType: lastChallenge.challengeType,
      challengeFiles: projectPreviewChallengeFiles,
      required: lastChallenge.required,
      template: lastChallenge.template
    }
  };
}

exports.createBlockIntroPages = function (createPage) {
  return function (edge) {
    const {
      fields: { slug },
      frontmatter: { block }
    } = edge.node;

    createPage({
      path: slug,
      component: intro,
      context: {
        block: dasherize(block),
        slug
      }
    });
  };
};

exports.createSuperBlockIntroPages = function (createPage) {
  return function (edge) {
    const {
      fields: { slug },
      frontmatter: { superBlock, certification }
    } = edge.node;

    if (!certification) {
      throw Error(
        `superBlockIntro page, '${superBlock}' must have certification in frontmatter`
      );
    }

    // TODO: throw if it encounters an unknown certification. Also, handle
    // coding-interview-prep. it's not a certification, but it is a superBlock.

    createPage({
      path: slug,
      component: superBlockIntro,
      context: {
        certification,
        superBlock,
        slug
      }
    });
  };
};
