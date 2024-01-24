const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { time } = require("console");
const app = express();
const port = 8000;

//起動確認
app.listen(port, function () {
  console.log(`サーバー起動 ${port}ポート`);
});

// パス取得
app.use(express.static(path.join(__dirname, "public")));
const path_original_media = "public/uploads/"; //元素材のアップロード先
const path_conv_media = "public/converted/"; //変換後素材のアップロード先

// タイムスタンプ取得
let timestamp = Date.now();

//アップロード
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path_original_media);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

//-----------ルーティング-----------
//インデックス
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});
// 圧縮
app.post("/comp", (req, res) => {
  res.sendFile(path.join(__dirname, "public/comp.html"));
});
// 変換
app.post("/conv", (req, res) => {
  res.sendFile(path.join(__dirname, "public/conv.html"));
});
// カット
app.post("/cut", (req, res) => {
  res.sendFile(path.join(__dirname, "public/cut.html"));
});
// 結合
app.post("/comb", (req, res) => {
  res.sendFile(path.join(__dirname, "public/comb.html"));
});
// 音声レベルアップ
app.post("/audio_increase", (req, res) => {
  res.sendFile(path.join(__dirname, "public/audio_increase.html"));
});

//------------処理------------
app.post("/comp_conv", upload.single("file"), function (req, res, next) {
  console.log(req.file);
  const i_filename = req.file.originalname;
  const bitrate = req.body.bitrate + "k";
  const o_filename = "sizedown_" + timestamp + "_" + i_filename;
  let command =
    "ffmpeg -i " +
    path_original_media +
    i_filename +
    " -b:v " +
    bitrate +
    " " +
    path_conv_media +
    o_filename +
    " &";
  const execSync = require("child_process").execSync;
  const stdout = execSync(command);
  res.download(path_conv_media + o_filename);
  deleteFile(path_original_media + i_filename);
});
// 変換
app.post("/conv_conv", upload.single("file"), function (req, res, next) {
  const i_filename = req.file.originalname;
  let o_filename = "";
  if (req.body.conv_radio == "MOV_to_mp4") o_filename = timestamp + ".mp4";
  else o_filename = timestamp + ".mp3";

  const command =
    "ffmpeg -i " +
    path_original_media +
    i_filename +
    " " +
    path_conv_media +
    o_filename +
    " &";
  const execSync = require("child_process").execSync;
  const stdout = execSync(command);
  res.download(path_conv_media + o_filename);
  deleteFile(path_original_media + i_filename);
});
// カット
app.post("/cut_conv", upload.single("file"), function (req, res, next) {
  console.log(req.file);
  const i_filename = req.file.originalname;
  const o_filename = "out_cut_" + timestamp + "_" + i_filename;
  const start_time =
    req.body.start_hh +
    ":" +
    req.body.start_mm +
    ":" +
    req.body.start_ss +
    "." +
    req.body.start_ms;
  const fin_time =
    req.body.fin_hh +
    ":" +
    req.body.fin_mm +
    ":" +
    req.body.fin_ss +
    "." +
    req.body.fin_ms;
  const command =
    "ffmpeg -ss " +
    start_time +
    " -to " +
    fin_time +
    " -i " +
    path_original_media +
    i_filename +
    " -c copy " +
    path_conv_media +
    o_filename +
    " &";
  const execSync = require("child_process").execSync;
  const stdout = execSync(command);

  res.download(path_conv_media + o_filename);
  deleteFile(path_original_media + i_filename);
});

// 結合
app.post(
  "/comb_conv",
  upload.fields([{ name: "file1" }, { name: "file2" }]),
  function (req, res, next) {
    // console.log(req.files);
    const file1Array = req.files["file1"];
    const file2Array = req.files["file2"];
    const file1Names = file1Array.map((file) => file.originalname);
    // const file2Names = file2Array.map((file) => file.originalname);
    const file1Paths = file1Array.map((file) => file.path);
    const file2Paths = file2Array.map((file) => file.path);

    const content = "file '" + file1Paths + "'\nfile '" + file2Paths + "'";
    fs.writeFileSync("list.txt", content);
    const o_filename = "out_comb_" + timestamp + file1Names;
    const command =
      "ffmpeg -safe 0 -f concat -i list.txt -c copy " +
      path_conv_media +
      o_filename +
      " &";
    const execSync = require("child_process").execSync;
    const stdout = execSync(command);
    res.download(path_conv_media + o_filename);
    deleteFile(path_original_media + i_filename);
    // deleteFile(file1Paths);
    // deleteFile(file2Paths);
  }
);

// 音声レベルアップ
app.post(
  "/audio_increase_conv",
  upload.single("file"),
  function (req, res, next) {
    console.log(req.file);
    const i_filename = req.file.originalname;
    const vol_num = req.body.volume;
    const o_filename = "out_volup_" + timestamp + "_" + i_filename;
    let command =
      "ffmpeg -i " +
      path_original_media +
      i_filename +
      " -af volume=" +
      vol_num +
      "dB " +
      path_conv_media +
      o_filename +
      " &";
    const execSync = require("child_process").execSync;
    const stdout = execSync(command);

    res.download(path_conv_media + o_filename);
    deleteFile(path_original_media + i_filename);
  }
);

function deleteFile(filePath) {
  try {
    fs.unlinkSync(filePath);
    // return true;
    console.log(filePath + " 削除しました。");
  } catch (err) {
    // return false;
    console.log(filePath + " 削除失敗しました。");
  }
}
