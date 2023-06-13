const { exec } = require("child_process");

// install libtinfo5
function run() {
  if (process.platform === 'linux') {
    exec("sudo apt-get install -y libtinfo5", (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    });
  }
}

module.exports.run = run;

run();

