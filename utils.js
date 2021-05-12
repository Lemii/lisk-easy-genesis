import {
  passphrase,
  cryptography,
  TokenModule,
  DPoSModule,
  KeysModule,
  SequenceModule,
  configDevnet,
} from "lisk-sdk";
import { balance, onion } from "./constants.js";
import { defaultOptions } from "./defaults.js";
import fs from "fs";
import * as userSchemas from "./input/schemas.js";

const credentials = [];

export const getCredentials = () => credentials;

export const encryptPassphrase = (passphrase, password) => {
  const encryptedPassphrase = cryptography.encryptPassphraseWithPassword(passphrase, password);
  return cryptography.stringifyEncryptedPassphrase(encryptedPassphrase);
};

export const createHashOnion = () => {
  const { count, distance } = onion;
  const seed = cryptography.generateHashOnionSeed();
  const hashBuffers = cryptography.hashOnion(seed, count, distance);
  const hashes = hashBuffers.map(buf => buf.toString("hex"));
  return { hashes, count, distance };
};

export const createDelegatesConfig = password => {
  const delegates = [];

  for (const account of credentials) {
    if (account.username) {
      delegates.push(
        new Promise((resolve, _reject) => {
          resolve({
            encryptedPassphrase: encryptPassphrase(account.passphrase, password),
            hashOnion: createHashOnion(),
            address: account.binaryAddress,
          });
        })
      );
    }
  }

  return Promise.all(delegates);
};

export const validateInputs = async ({ blockTime, activeDelegates, standbyDelegates }) => {
  if (blockTime < 4) {
    throw new Error("Block time must be equal or greater than 4");
  }

  if (activeDelegates < 6) {
    throw new Error("Number of delegates must be equal or greater than 6");
  }

  if (standbyDelegates < 0) {
    throw new Error("Number of delegates must be equal or greater than 0");
  }
};

export const createSchemas = () => {
  const token = new TokenModule(configDevnet.genesisConfig).accountSchema;
  const dpos = new DPoSModule(configDevnet.genesisConfig).accountSchema;
  const keys = new KeysModule(configDevnet.genesisConfig).accountSchema;
  const sequence = new SequenceModule(configDevnet.genesisConfig).accountSchema;

  token.fieldNumber = 2;
  dpos.fieldNumber = 3;
  keys.fieldNumber = 4;
  sequence.fieldNumber = 5;

  let schemas = { token, dpos, keys, sequence };

  Object.entries(userSchemas).map(([key, value], index) => {
    schemas[key] = { ...value, fieldNumber: index + 6 };
  });

  return schemas;
};

export const getOptionsUsingConfig = config => {
  return {
    ...defaultOptions,
    label: config.label,
    communityIdentifier: config.genesisConfig.communityIdentifier,
    activeDelegates: config.genesisConfig.activeDelegates,
    standbyDelegates: config.genesisConfig.standbyDelegates,
    password: config.forging.defaultPassword,
  };
};

export const saveJson = (path, data) => {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
};

export const logger = (message, icon = "⚙️ ") => {
  console.log(`${icon}  ${message}`);
};

/*
Functions below are taken from / based on the excellent 'Generating a genesis block' guide
written by Mona Bärenfänger.

Source: https://lisk.io/documentation/lisk-sdk/guides/app-development/genesis-block.html
*/

export const newCredentials = () => {
  const pass = passphrase.Mnemonic.generateMnemonic();
  const keys = cryptography.getPrivateAndPublicKeyFromPassphrase(pass);
  const credentials = {
    address: cryptography.getBase32AddressFromPassphrase(pass),
    binaryAddress: cryptography.getAddressFromPassphrase(pass).toString("hex"),
    passphrase: pass,
    publicKey: keys.publicKey.toString("hex"),
    privateKey: keys.privateKey.toString("hex"),
  };
  return credentials;
};

export const newDelegate = username => {
  const cred = newCredentials();
  credentials.push({ ...cred, username });
  const delegate = {
    address: Buffer.from(cred.binaryAddress, "hex"),
    token: { balance: balance.genesisDelegate },
    dpos: { delegate: { username } },
  };
  return delegate;
};

export const newAccount = () => {
  const cred = newCredentials();
  credentials.push(cred);
  const account = {
    address: Buffer.from(cred.binaryAddress, "hex"),
    token: { balance: balance.genesisAccount },
  };
  return account;
};

export const generateAccounts = amount => {
  const accounts = [];
  for (let i = 1; i <= amount; i++) {
    accounts.push(newAccount());
  }
  return accounts;
};

export const generateDelegates = (prefix = "genesis", amount) => {
  const delegates = [];
  for (let i = 1; i <= amount; i++) {
    let nameNumber = `${prefix}_${i}`;
    delegates.push(newDelegate(nameNumber));
  }
  return delegates;
};
