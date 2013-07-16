GitHubApi = require "github"
fs = require 'fs'
crypto = require 'crypto'

galleryGithub = new GitHubApi({
  version: "3.0.0",
  timeout: 5000
})
#��֤github�˺�
galleryGithub.authenticate({
  type: "oauth",
  token: "7d9e8064e9b3e5d5311c6eabe9fcf6d1243481f8"
})

#ͬ�������Ϣ
syncCom = (com,callback)->
  path = "#{com}/abc.json";
  comInfos = "gallery-express/component-info.json";
  fs.readFile path,'utf8',(err,data)->
    if data
      try
        data = JSON.parse(data);
        if data.author.email
          md5 = crypto.createHash 'md5'
          md5.update data.author.email, 'utf8'
          data.author.md5 = md5.digest 'hex'
        #��ȡ�����������Ϣ
        fs.readFile comInfos,'utf8',(err,coms)->
          if coms
            try
              coms = JSON.parse coms
              authors = coms.authors
              authors[data.author.name] = data.author

              isExist = false
              for com,i in coms.components
                if com.name is data.name
                  isExist = true;
                  addGithubData(data,(comData)->
                    coms.components[i] = comData
                    writeJson(coms,->
                      callback && callback(comData)
                    )
                  )
                  return true

              unless isExist
                addGithubData(data,(comData)->
                  coms.components.push(comData);
                  writeJson(coms,->
                    callback && callback(comData)
                  )
                )
###
���github�Ŀ���Ϣ
###
addGithubData = (data,callback)->
  #����github�������Ϣ
  galleryGithub.repos.get({
  user: 'kissygalleryteam',
  repo: data.name
  },(err,result)->
    unless result.message
      keys = ['forks','watchers','updated_at','created_at','description','size']
      for key in keys
        data[key] = result[key]
      callback && callback(data)
  )
###
�������Ϣд�뵽component-info.json��
###
writeJson = (coms,callback)->
  fs.writeFile('gallery-express/component-info.json', JSON.stringify(coms),(err)->
    callback && callback(coms);
  )

exports.sync = (req,res)->
  com = req.params.name
  syncCom(com,(data)->
    res.json data
  )

exports.syncAll = (req,res)->
