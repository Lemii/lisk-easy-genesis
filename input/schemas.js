/************************************************
EXAMPLE ACCOUNT SCHEMA FOR MODULE 'myCustomModule'

export const myCustomModule = {
  type: "object",
  properties: {
    myCustomField: {
      fieldNumber: 1,
      type: "array",
      items: {
        dataType: "string",
      },
    },
  },
  default: {
    myCustomField: [],
  },
};
************************************************/
