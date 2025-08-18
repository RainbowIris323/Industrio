"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssertMacro = void 0;
var typescript_1 = require("typescript");
var shared_1 = require("../../../util/shared");
function templated(templatesArray) {
    var values = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        values[_i - 1] = arguments[_i];
    }
    if (templatesArray.length === 1 && values.length === 0) {
        return typescript_1.factory.createStringLiteral(templatesArray[0]);
    }
    else if (values.length === 0) {
        return typescript_1.factory.createNoSubstitutionTemplateLiteral(templatesArray[0]);
    }
    else {
        var spans = new Array();
        for (var i = 0; i < values.length; i++) {
            var value = values[i];
            var prefix = templatesArray[i + 1];
            // If last, tail
            if (i === values.length - 1) {
                spans.push(typescript_1.factory.createTemplateSpan(value, typescript_1.factory.createTemplateTail(prefix)));
            }
            else {
                spans.push(typescript_1.factory.createTemplateSpan(value, typescript_1.factory.createTemplateMiddle(prefix)));
            }
        }
        return typescript_1.factory.createTemplateExpression(typescript_1.factory.createTemplateHead(templatesArray[0]), spans);
    }
}
exports.AssertMacro = {
    getSymbol: function (state) {
        return state.symbolProvider.moduleFile.get("$assert");
    },
    transform: function (state, node) {
        if (node.arguments.length === 2) {
            return typescript_1.factory.updateCallExpression(node, typescript_1.factory.createIdentifier("assert"), undefined, [
                node.arguments[0],
                templated(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " ", ": ", ""], ["", " ", ": ", ""])), (0, shared_1.createDebugPrefixLiteral)(node), typescript_1.factory.createStringLiteral(node.arguments[0].getText()), node.arguments[1]),
            ]);
        }
        else {
            return typescript_1.factory.updateCallExpression(node, typescript_1.factory.createIdentifier("assert"), undefined, [
                node.arguments[0],
                templated(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " ", ": Assertion failed!"], ["", " ", ": Assertion failed!"])), (0, shared_1.createDebugPrefixLiteral)(node), typescript_1.factory.createStringLiteral(node.arguments[0].getText())),
            ]);
        }
    },
};
var templateObject_1, templateObject_2;
