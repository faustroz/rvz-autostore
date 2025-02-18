const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
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
      .setTitle("RVZ Realtime's Stock")
      .setImage(imageURL)
      .setTimestamp()
      .setFooter({ text: "Rendezvous's Store" });

    products.forEach((product) => {
      stockInfoEmbed.addFields(
        {
          name: `${emoji2}  ${product.name}`,
          value: `${emoji1} Code: **${product.code}**\n${emoji1}    Stock: **${product.stock}**\n${emoji1}  Price: **${product.price}** ${wlEmoji}\n―――――――――――――\n`,
          inline: false,
        }
      );
    });

    // Create a refresh button
    const buyButton = new ButtonBuilder()
    .setCustomId('buy_button')
    .setLabel('Buy')
    .setEmoji('🛒') // Shopping cart emoji
    .setStyle(ButtonStyle.Success);
  
    const setGrowIDButton = new ButtonBuilder()
    .setCustomId('set_growid_button')
    .setLabel('Set GrowID')
    .setEmoji('🌱') // Seedling emoji to symbolize growth
    .setStyle(ButtonStyle.Success);
  
    const balanceButton = new ButtonBuilder()
    .setCustomId('balance_button')
    .setLabel('Balance')
    .setEmoji(`${wlEmoji}`) // Money bag emoji for balance
    .setStyle(ButtonStyle.Success);
  
    const depositButton = new ButtonBuilder()
    .setCustomId('deposit_button')
    .setLabel('Deposit')
    .setEmoji('🏦') // Bank emoji for deposit
    .setStyle(ButtonStyle.Success);
  
    const howToBuyButton = new ButtonBuilder()
    .setCustomId('howtobuy_button')
    .setLabel('How to Buy')
    .setEmoji('❓') // Question mark emoji for guidance
    .setStyle(ButtonStyle.Success);
  
    const row = new ActionRowBuilder().addComponents(buyButton, setGrowIDButton);
    const row_2 = new ActionRowBuilder().addComponents(balanceButton, depositButton, howToBuyButton);
    
    let sentMessage;
    if (!message._editedMessage) {
      sentMessage = await message.channel.send({ embeds: [stockInfoEmbed], components: [row, row_2] });
      message._editedMessage = sentMessage;
    } else {
      sentMessage = await message._editedMessage.edit({ embeds: [stockInfoEmbed], components: [row, row_2] });
    }

    return sentMessage;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};

module.exports = { sendStockMessage };
