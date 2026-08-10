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
4. Read `cloudinary-upload-result.json` from the artifact and use its
   `secure_url` in the article.
5. Close the temporary pull request without merging and delete the temporary
   branch. The image must never be added to `main`.

The workflow runs only for same-repository branches with the designated branch
prefix. It checks out the uploader from the PR base commit, so the incoming
branch supplies the image but not the code that receives the secret.
