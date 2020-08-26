module.exports = {
    generate: function () {
        let result = {};
        result.id = 1;
        result.content = "Bardzo solidna captcha";
        result.type = 1;
        return result;
    },
    validate: function (response, id) {
        if (response.length == 1) {
            return true;
        }
        else {
            return false;
        }
    }

}