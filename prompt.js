import prompt from "prompt";

prompt.message = "";
prompt.delimiter = " >";

const schema = {
  properties: {
    communityIdentifier: {
      description: "Name of sidechain",
      pattern: /^[a-zA-Z\s\-]+$/,
      message: "Name must be only letters, spaces, or dashes",
      required: true,
    },
    label: {
      description: "Label of sidechain",
      pattern: /^[a-zA-Z][a-zA-Z_-]*$/,
      message: "Label must be only letters or dashes",
      required: true,
      default: "devnet",
    },
    blockTime: {
      pattern: /^[0-9]*$/,
      type: "number",
      description: "Block time in seconds",
      message: "blockTime must be a number",
      required: true,
      default: 10,
      before: value => parseInt(value),
    },
    activeDelegates: {
      pattern: /^[0-9]*$/,
      description: "Number of active delegates",
      message: "activeDelegates must be a number",
      required: true,
      default: 101,
      before: value => parseInt(value),
    },
    standbyDelegates: {
      pattern: /^[0-9]*$/,
      description: "Number of standby delegates",
      message: "standbyDelegates must be a number",
      required: true,
      default: 2,
      before: value => parseInt(value),
    },
    prefix: {
      description: "Prefix for genesis delegate usernames",
      pattern: /^[a-z]*$/,
      message: "Prefix must be only lowercase letters",
      default: "genesis",
      required: true,
    },
    accounts: {
      pattern: /^[0-9]*$/,
      description: "Number of (non-delegate) genesis accounts",
      message: "accounts must be a number",
      required: true,
      default: 3,
      before: value => parseInt(value),
    },
  },
};

export const runPrompt = cb => {
  prompt.start();

  prompt.get(schema, (err, result) => {
    if (err) {
      return onErr(err);
    }

    cb(result);
  });

  function onErr(err) {
    console.log(err);
    return 1;
  }
};
