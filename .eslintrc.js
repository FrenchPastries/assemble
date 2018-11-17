module.exports = {
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 9,
    "sourceType": "module"
  },
  "env": {
    "es6": true,
    "amd": true,
    "node": true
  },
  "rules": {
    "no-unused-vars": 1,
    "no-console": [
      "error",
      {
        "allow": [
          "log",
          "warn",
          "error"
        ]
      }
    ]
  }
}
