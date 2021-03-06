// Generated by CoffeeScript 1.6.2
(function() {
  var GitHubApi, INFOS_URL, addGithubData, crypto, fs, galleryGithub, syncCom, writeJson;

  GitHubApi = require("github");

  fs = require('fs');

  crypto = require('crypto');

  galleryGithub = new GitHubApi({
    version: "3.0.0",
    timeout: 5000
  });

  galleryGithub.authenticate({
    type: "oauth",
    token: "7d9e8064e9b3e5d5311c6eabe9fcf6d1243481f8"
  });

  INFOS_URL = 'gallery-express/component-info.json';

  syncCom = function(com, callback) {
    var comInfos, path;

    path = "" + com + "/abc.json";
    comInfos = INFOS_URL;
    return fs.readFile(path, 'utf8', function(err, data) {
      var md5;

      if (err) {
        callback && callback({}, {});
        return false;
      }
      if (data) {
        try {
          data = JSON.parse(data);
          if (data.author.email) {
            md5 = crypto.createHash('md5');
            md5.update(data.author.email, 'utf8');
            data.author.md5 = md5.digest('hex');
          }
          return fs.readFile(comInfos, 'utf8', function(err, coms) {
            var authors, i, isExist, _i, _len, _ref;

            if (coms) {
              try {
                coms = JSON.parse(coms);
                authors = coms.authors;
                authors[data.author.name] = data.author;
                isExist = false;
                _ref = coms.components;
                for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
                  com = _ref[i];
                  if (com.name === data.name) {
                    isExist = true;
                    addGithubData(data, function(comData) {
                      coms.components[i] = comData;
                      return writeJson(coms, function() {
                        return callback && callback(comData, coms);
                      });
                    });
                    return true;
                  }
                }
                if (!isExist) {
                  return addGithubData(data, function(comData) {
                    coms.components.push(comData);
                    return writeJson(coms, function() {
                      return callback && callback(comData, coms);
                    });
                  });
                }
              } catch (_error) {}
            }
          });
        } catch (_error) {}
      }
    });
  };

  /*
  添加github的库信息
  */


  addGithubData = function(data, callback) {
    return galleryGithub.repos.get({
      user: 'kissygalleryteam',
      repo: data.name
    }, function(err, result) {
      var key, keys, _i, _len;

      if (!result) {
        return false;
      }
      if (!result.message) {
        keys = ['forks', 'watchers', 'updated_at', 'created_at', 'description', 'size'];
        for (_i = 0, _len = keys.length; _i < _len; _i++) {
          key = keys[_i];
          if (key === 'updated_at' || key === 'created_at') {
            data[key] = new Date(result[key]).getTime();
          } else {
            data[key] = result[key];
          }
        }
        return callback && callback(data);
      }
    });
  };

  /*
  将组件信息写入到component-info.json内
  */


  writeJson = function(coms, callback) {
    coms.count = coms.components.length;
    coms.update = Date.now();
    return fs.writeFile(INFOS_URL, JSON.stringify(coms), function(err) {
      return callback && callback(coms);
    });
  };

  exports.sync = function(req, res) {
    var com;

    com = req.params.name;
    return syncCom(com, function(data) {
      return res.json(data);
    });
  };

  exports.syncAll = function(req, res) {
    var result;

    result = {
      authors: {},
      components: [],
      date: Date.now()
    };
    return writeJson(result, function() {
      var dirs, i, sync;

      dirs = fs.readdirSync('./');
      i = 0;
      sync = function(name, coms) {
        i++;
        if (i === dirs.length + 1) {
          coms && res.json(coms);
          return true;
        }
        return syncCom(name, function(com, coms) {
          return sync(dirs[i], coms);
        });
      };
      return sync(dirs[i]);
    });
  };

  exports.getInfo = function(req, res) {
    var comName, json;

    comName = req.params.name;
    json = {};
    if (!comName) {
      return res.send('组件名不能为空！');
    }
    return fs.readFile(INFOS_URL, 'utf8', function(err, data) {
      var com, coms, _i, _len;

      data = JSON.parse(data);
      coms = data.components;
      for (_i = 0, _len = coms.length; _i < _len; _i++) {
        com = coms[_i];
        if (com.name === comName) {
          json = com;
        }
      }
      return res.json(json);
    });
  };

}).call(this);
