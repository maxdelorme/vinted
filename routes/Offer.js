const express = require("express");
const router = express.Router();
const Offer = require("../models/Offer");
const isAuthenticated = require("../middleware/isAuthenticated");
const fileUpload = require("express-fileupload");
const binaryToCloudinaryImage = require("../utils/binaryToCloudinaryImage");
const deleteCloudinaryImage = require("../utils/deleteCloudinaryImage");
const mongoose = require("mongoose");
const { gte } = require("lodash");

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      if (
        ![
          "title",
          "description",
          "price",
          "brand",
          "size",
          "condition",
          "color",
          "city",
        ].every((prop) => prop in req.body)
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide all requirements for Offer",
        });
      }
      if (
        req.body.description.length > 500 ||
        req.body.title.length > 50 ||
        Number(req.body.price) > 100000
      )
        return res.status(400).json({
          success: false,
          message: "Invalid parameters",
        });

      var newOfferId = new mongoose.Types.ObjectId();

      const cloudinaryImage = await binaryToCloudinaryImage(
        req?.files?.product_image,
        `/vinted/offers/${newOfferId}/`
      );

      const newOffer = new Offer({
        _id: newOfferId,
        product_name: req.body.title,
        product_description: req.body.description,
        product_price: req.body.price,
        product_details: [
          { MARQUE: req.body.brand },
          { TAILLE: req.body.size },
          { ÉTAT: req.body.condition },
          { COULEUR: req.body.color },
          { EMPLACEMENT: req.body.city },
        ],
        product_image: cloudinaryImage,
        owner: req.user._id,
      });

      await newOffer.save();

      await newOffer.populate("owner", "account");

      return res.status(201).json(newOffer);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

router.put("/offers/:id", isAuthenticated, fileUpload(), async (req, res) => {
  try {
    if (
      ![
        "title",
        "description",
        "price",
        "brand",
        "size",
        "condition",
        "color",
        "city",
      ].every((prop) => prop in req.body)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all requirements for Offer",
      });
    }

    if (
      req.body.description.length > 500 ||
      req.body.title.length > 50 ||
      Number(req.body.price) > 100000
    )
      return res.status(400).json({
        success: false,
        message: "Invalid parameters",
      });

    const offer = await Offer.findById(req.params.id);

    if (!req.body.keepOfferImage) {
      await deleteCloudinaryImage(offer.product_image);
      offer.product_image = undefined;
      const cloudinaryImage = await binaryToCloudinaryImage(
        req?.files?.product_image,
        `/vinted/offers/${offer._id}/`
      );
      offer.product_image = cloudinaryImage;
    }
    offer.product_name = req.body.title;
    offer.product_description = req.body.description;
    offer.product_price = req.body.price;
    offer.product_details = [
      { MARQUE: req.body.brand },
      { TAILLE: req.body.size },
      { ÉTAT: req.body.condition },
      { COULEUR: req.body.color },
      { EMPLACEMENT: req.body.city },
    ];

    await offer.save();
    await offer.populate("owner", "account");

    return res.status(201).json(offer);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete("/offers/:id", isAuthenticated, async (req, res) => {
  try {
    const deletedOffer = await Offer.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!deletedOffer)
      return res.status(404).json({ message: "Offer not found" });

    if (deletedOffer?.product_image?.public_id) {
      await deleteCloudinaryImage(deletedOffer.product_image);
    }

    return res.json({ message: "Offer deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/my_offers", isAuthenticated, async (req, res) => {
  return res.json(
    await Offer.find({ owner: req.user._id }, "owner product_image")
  );
});
router.get("/offers", async (req, res) => {
  try {
    const filter = {};
    const pageSize = 2;

    if (req.query.title) {
      filter.$or = [
        { product_name: new RegExp(req.query.title, "i") },
        { product_description: new RegExp(req.query.title, "i") },
      ];
    }
    if (req.query.priceMin) {
      filter.product_price = { $gte: Number(req.query.priceMin) };
    }
    if (req.query.priceMax) {
      if (!filter.product_price) filter.product_price = {};
      filter.product_price.$lte = Number(req.query.priceMax);
    }

    const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;

    const sort = { product_price: req.query.sort !== "price-desc" ? 1 : -1 };

    // const result = await Offer.find(filter)
    //   .select("product_name product_price")
    //   .sort(sort)
    //   .skip((page - 1) * pageSize)
    //   .limit(pageSize);
    //   .populate("owner", "account")

    let result = await Offer.aggregate([
      {
        $match: filter,
      },
      // {
      //   $project: { product_name: 1, product_price: 1 },
      // },
      {
        $facet: {
          metaData: [
            { $count: "totalOffers" },
            { $addFields: { pageSize: pageSize, currentPage: page } },
          ],
          data: [
            { $sort: sort },
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                  {
                    $project: { account: 1 },
                  },
                ],
              },
            },

            { $unwind: "$owner" },
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
          ],
        },
      },
    ]);

    result = result[0];

    if (!result.metaData.length)
      return res.status(400).json({ message: "Pas d'offre correspondante" });
    if (!result.data.length)
      return res.status(400).json({ message: "Page demandée trop grande" });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/offers/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: "Please provide a valid ID" });

  const offer = await Offer.findById(req.params.id).populate("owner");
  if (!offer)
    return res.status(404).json({ message: "Pas d'offre correspondante" });

  return res.json(offer);
});

module.exports = router;
