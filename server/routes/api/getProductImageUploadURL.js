const express = require("express");
const router = express.Router();
const passport = require("passport");
var AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

var s3 = new AWS.S3({
  accessKeyId: process.env.S3_ACCESS_KEY?.trim(),
  secretAccessKey: process.env.S3_SECRET_KEY?.trim(),
  region: process.env.S3_CDN_REGION?.trim(),
  signatureVersion: "v4",
  apiVersion: "2006-03-01",
});

const getPresignedAWSUploadURL = (folderPath, fileName, fileType) => {
  const bucketName = process.env.S3_CDN_BUCKET_NAME;
  const fileNameParts = fileName.split(".");
  const fileExtension = fileNameParts[fileNameParts.length - 1];
  var key = `${folderPath}/${uuidv4()}.${fileExtension}`;
  const signedUrlExpireSeconds = 60 * 5;

  const url = s3.getSignedUrl("putObject", {
    Bucket: bucketName,
    Key: key,
    Expires: signedUrlExpireSeconds,
    ContentType: fileType,
    ACL: "public-read",
    //Fields: { acl: "public-read", "Content-Type": fileType },
    //Conditions: [{ acl: "public-read" }, { "Content-Type": fileType }],
  });
  return { url, key };
};

router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const fileType = req.body.fileType;
    const fileName = req.body.fileName;
    if (!fileType) return res.status(400).end("File type is missing");
    if (!fileName) return res.status(400).end("File name is missing");
    try {
      const { url, key: filePath } = getPresignedAWSUploadURL(
        "product-images",
        fileName,
        fileType
      );
      if (!url) throw new Error();
      res.status(200).json({
        url,
        filePath,
      });
    } catch (e) {
      console.log(e);
      res.status(500).end("Cannot generate upload url");
    }
  }
);

module.exports = router;
