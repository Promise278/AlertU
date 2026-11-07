'use strict';

const crypto = require('crypto');
const AppError = require('../util/AppError');
const asyncHandler = require('../util/asyncHandler');

const createSignature = asyncHandler(async (req, res) => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw AppError.serviceUnavailable(
      'Image uploads are not configured. Contact the AlertU administrator.',
      'UPLOADS_NOT_CONFIGURED'
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `alertu/reports/${req.user.id}`;
  const allowedFormats = 'jpg,png,webp';
  const signaturePayload =
    `allowed_formats=${allowedFormats}&folder=${folder}&timestamp=${timestamp}` +
    CLOUDINARY_API_SECRET;
  const signature = crypto
    .createHash('sha1')
    .update(signaturePayload)
    .digest('hex');

  res.status(200).json({
    data: {
      cloudName: CLOUDINARY_CLOUD_NAME,
      apiKey: CLOUDINARY_API_KEY,
      timestamp,
      folder,
      allowedFormats,
      signature,
    },
  });
});

module.exports = { createSignature };
