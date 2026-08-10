# Article image uploads

New article images are stored in Cloudinary. The repository contains a narrowly
scoped GitHub Actions workflow so a ChatGPT Work session can upload an attached
image without receiving the Cloudinary credentials.

## One-time setup

Add `CLOUDINARY_URL` as a repository Actions secret. Its value is the complete
`cloudinary://...` URL. Do not place that value in a file, issue, pull request,
workflow input, or chat message.

## Upload flow

1. Start a temporary branch named `agent/cloudinary-upload-<description>` from
   the latest `main`.
2. Put exactly one image under `cloudinary-upload/`. Its path below that
   directory becomes the Cloudinary public ID, without the file extension. For
   example, `cloudinary-upload/article/2026-08-10-example/photo.jpg` becomes
   `article/2026-08-10-example/photo`.
3. Open a pull request to `main`. The `Upload article image to Cloudinary`
   workflow uploads the image and produces the one-day
   `cloudinary-upload-result` artifact.
4. Read `cloudinary-upload-result.json` from the artifact. Before using its
   `secure_url`, compare the staged image with the received original using the
   byte count and SHA-256 digest. A matching filename or dimensions is not
   sufficient: binary transfer through a tool can be truncated while retaining
   valid image dimensions.
5. Download the image from `secure_url` and compare its byte count and SHA-256
   digest with the received original. Use the URL in the article only after all
   three copies--received, staged, and Cloudinary-delivered--match.
6. Close the temporary pull request without merging. Its cleanup job deletes
   the temporary branch automatically. The image must never be added to `main`.

The workflow runs only for same-repository branches with the designated branch
prefix. It checks out the uploader from the PR base commit, so the incoming
branch supplies the image but not the code that receives the secret.

If any size or digest differs, stop and identify which transfer changed the
file. Do not update the article or merge the upload pull request. The upload can
be rerun from a known-complete Git blob when one already exists, but the final
Cloudinary delivery must still be checked against the original.
