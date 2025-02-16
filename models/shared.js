const { EmbedBuilder } = require('discord.js');
const Product = require('../models/product');
const { thumbnailURL, imageURL, wlEmoji, emoji1, emoji2 } = require('../config.json');

const sendStockMessage = async (message) => {
  try {
    const products = await Product.find();

    if (products.length === 0) {
      return message.reply('No products found in the database.');
    }

    const stockInfoEmbed = new EmbedBuilder()
      .setColor('#007fff')
      .setTitle("<:18220crown:1340507514336182364> RVZ Realtime's Stock <:18220crown:1340507514336182364>")
      .setImage(imageURL)
      .setTimestamp()
    .setFooter({ text: "Rendezvous's Store" });

    products.forEach((product) => {
      stockInfoEmbed.addFields(
        {
          name: `${emoji2}  ${product.name}`, // Product name
          value: `${emoji1}  Code: **${product.code}**\n${emoji1}  Stock: **${product.stock}**\n${emoji1}  Price: **${product.price}** ${wlEmoji}\n------------------------------------------\n`,
          inline: false,
        }
      );
    });

    let sentMessage;

    if (!message._editedMessage) {
      // Send the initial stock message
      sentMessage = await message.channel.send({ embeds: [stockInfoEmbed] });
      message._editedMessage = sentMessage; // Store the initial message for editing
    } else {
      // Edit the existing message to update stock information
      sentMessage = await message._editedMessage.edit({ embeds: [stockInfoEmbed] });
    }

    return sentMessage; // Return the sent message object
  } catch (error) {
    console.error('Error:', error);
    return null; // Return null in case of an error
  }
};

module.exports = { sendStockMessage };
