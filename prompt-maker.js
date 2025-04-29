import fs from 'fs';
const srcFolder = './src';
const promptTextFile = `./prompt.txt`;

const getFile = (path) => {
  // If path is a folder, go inside

  const fileOrFolder = fs.statSync(path);
  if (fileOrFolder.isDirectory()) {
    // get the files in the folder
    const files = fs.readdirSync(path);
    return files.map(file => getFile(`${path}/${file}`));
  }else{
    // add content to prompt.txt with the path and content like
    // src/components/IntentNode.tsx
    // <content>

    fs.appendFileSync(promptTextFile, `${path}\n`);
    fs.appendFileSync(promptTextFile, fs.readFileSync(path, 'utf8'));
    fs.appendFileSync(promptTextFile, '\n');
    fs.appendFileSync(promptTextFile, '\n');
  }
}

fs.appendFileSync(promptTextFile, 'I am creating a react-flow project. Below are my files.\n');
getFile(srcFolder);
fs.appendFileSync(promptTextFile, 'I will ask some modification to do in this code from you. Please give me only the complete modfied files in a code block as per request.\n');
