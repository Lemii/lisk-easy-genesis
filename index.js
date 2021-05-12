import { genesis } from "lisk-sdk";
import * as utils from "./utils.js";
import { paths } from "./constants.js";
import { runPrompt } from "./prompt.js";
import fs from "fs";
import figlet from "figlet";

const config = JSON.parse(fs.readFileSync("./input/baseConfig.json"));
const { logger } = utils;
const isInteractive = process.argv[2] === "wizard";
const platformIsSupported = ["darwin", "linux"].includes(process.platform);

const main = async (result = {}) => {
  const options = { ...utils.getOptionsUsingConfig(config), ...result };

  logger("Validating inputs...", "🔍");
  await utils.validateInputs(options).catch(err => {
    console.error(err);
    process.exit(1);
  });

  logger("Creating account schemas...");
  const accountAssetSchemas = utils.createSchemas();

  logger("Generating delegates...");
  const delegates = utils.generateDelegates(
    options.prefix,
    options.activeDelegates + options.standbyDelegates
  );

  logger("Generating accounts...");
  const genesisAccounts = utils.generateAccounts(options.accounts);

  logger("Generating genesis block...");
  const accounts = [...delegates, ...genesisAccounts];
  const genesisBlockParams = {
    initDelegates: delegates.map(a => a.address),
    accounts,
    accountAssetSchemas,
  };
  const genesisBlock = genesis.createGenesisBlock(genesisBlockParams);

  logger("Converting genesis block to JSON...");
  const genesisJson = genesis.getGenesisBlockJSON({ accountAssetSchemas, genesisBlock });

  logger("Generating forging configuration...");
  const delegatesConfig = await utils.createDelegatesConfig(options.password);

  logger("Finalizing config object...");
  config.label = options.label;
  config.genesisConfig.communityIdentifier = options.communityIdentifier;
  config.genesisConfig.blockTime = options.blockTime;
  config.genesisConfig.activeDelegates = options.activeDelegates;
  config.genesisConfig.standbyDelegates = options.standbyDelegates;
  config.forging.delegates = delegatesConfig;

  logger(`Saving config to ${paths.config}`, "💾");
  utils.saveJson("./output/config.json", config);

  logger(`Saving genesis block to ${paths.genesisBlock}`, "💾");
  utils.saveJson("./output/genesisBlock.json", genesisJson);

  logger(`Saving credentials to ${paths.credentials}`, "💾");
  utils.saveJson("./output/credentials.json", utils.getCredentials());

  logger(`For it is done.\n`, "✅");
};

if (!platformIsSupported) {
  console.error(`Platform ${process.platform} is not supported. Exiting now...`);
  process.exit(1);
}

console.log(
  figlet.textSync("Lisk Easy Genesis", {
    horizontalLayout: "default",
    verticalLayout: "default",
    width: 80,
    whitespaceBreak: true,
  })
);
console.log(" by delegate lemii\n more tools at lisktools.eu\n");

isInteractive ? runPrompt(main) : main();
