/*
 * @文件描述:
 * @公司: thundersdata
 * @作者: 陈杰
 * @Date: 2019-10-23 20:54:44
 * @LastEditors: 陈杰
 * @LastEditTime: 2019-11-07 14:53:32
 */
import fs from 'fs';
import path from 'path';
import download from 'download-git-repo';
import symbols from 'log-symbols';
import handlebars from 'handlebars';
import chalk from 'chalk';
import ora from 'ora';

import replaceProject from './utils/replaceProject';
import walk from './utils/walk';
import translateFilePath from './utils/translateFilePath';
import deleteOldDirs from './utils/deleteOldDirs';

export default {
  init: function(
    answers: {
      description?: string;
      author?: string;
      version?: string;
    },
    projectName: string,
  ) {
    const repository = 'direct:https://github.com/thundersdata-frontend/rn-template#master';
    console.log(symbols.success, chalk.green(`模板地址：${repository}`));
    const spinner = ora('正在下载模板，请稍候...');
    spinner.start();
    download(repository, projectName, { clone: true }, (err: string) => {
      if (err) {
        spinner.fail();
        console.log(symbols.error, chalk.red(err));
      } else {
        spinner.succeed();

        const srcPath = path.resolve(projectName);
        // 替换和生成所有重命名之后的文件和文件夹
        walk(srcPath).forEach(absoluteSrcFilePath => {
          const relativeFilePath = path.relative(srcPath, absoluteSrcFilePath);
          const relativeRenamedPath = translateFilePath(relativeFilePath)
            .replace(/rnTemplate/g, projectName)
            .replace(/rntemplate/g, projectName.toLowerCase());

          replaceProject(absoluteSrcFilePath, path.resolve(srcPath, relativeRenamedPath), {
            'Hello App Display Name': projectName,
            rnTemplate: projectName,
            rntemplate: projectName.toLowerCase(),
          });
        });
        // 删除以前的旧的文件夹和文件夹下的内容
        walk(srcPath).forEach(absoluteSrcFilePath => {
          if (fs.existsSync(absoluteSrcFilePath) && fs.statSync(absoluteSrcFilePath).isDirectory()) {
            if (absoluteSrcFilePath.includes('rnTemplate') || absoluteSrcFilePath.includes('rntemplate')) {
              deleteOldDirs(absoluteSrcFilePath);
            }
          }
        });
        // 替换package.json里面的占位符
        const fileName = `${projectName}/package.json`;
        const meta = {
          name: projectName,
          description: answers.description,
          author: answers.author,
          version: answers.version,
        };
        if (fs.existsSync(fileName)) {
          const content = fs.readFileSync(fileName).toString();
          const result = handlebars.compile(content)(meta);
          fs.writeFileSync(fileName, result);
        }
        console.log(symbols.success, chalk.green('项目初始化完成'));
      }
    });
  },
};
