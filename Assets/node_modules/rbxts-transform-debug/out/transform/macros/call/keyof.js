"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeysOfMacro = void 0;
var typescript_1 = require("typescript");
exports.KeysOfMacro = {
    getSymbol: function (state) {
        return state.symbolProvider.moduleFile.get("$keysof");
    },
    transform: function (state, expression) {
        var argument = expression.arguments[0];
        var typeArguments = expression.typeArguments;
        if (argument !== undefined) {
            var symbol = state.typeChecker.getSymbolAtLocation(argument);
            if (symbol !== undefined && symbol.declarations) {
                console.log(symbol.declarations[0].getText());
            }
        }
        else if (typeArguments) {
            var typeArgument = typeArguments[0];
            var typeSymbol = state.typeChecker.getSymbolAtLocation(typeArgument);
            console.log(typeArgument.kind);
            if (typeSymbol !== undefined && typeSymbol.valueDeclaration) {
                console.log(typeSymbol.valueDeclaration.getText());
            }
        }
        return typescript_1.factory.createVoidExpression(typescript_1.factory.createNumericLiteral(0));
    },
};
