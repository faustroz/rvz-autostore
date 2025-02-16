// Import necessary libraries
const Product = require('../models/product');
const User = require('../models/user');
const purchaseEmitter = require('../events/purchaseEmitter');
const fs = require('fs');
const mongoose = require('mongoose'); // Import Mongoose
const { imageURL, wlEmoji, emoji1, emoji2, roleToadd } = require('../config.json');
const { buylogChannelId } = require('../config.json'); // Replace with the ID of your chosen log channel
const OrderCount = require('../models/orderCount'); // Import the OrderCount model
const { EmbedBuilder } = require('discord.js');

// Initialize the order count from the database
let orderCount = 0;

// Function to get the order count from the database
const getOrderCount = async () => {
  const orderCountDoc = await OrderCount.findOne();
  if (orderCountDoc) {
    return orderCountDoc.count;
  }
  return 0; // Return 0 if no orderCount document found
};

module.exports = {
  name: 'buy',
  description: 'Buy a random product',
  async execute(message, args) {
    if (!message.guild) {
      return message.reply('This command can only be used in a guild.');
    }

    if (args.length < 2) {
      return message.reply('Please provide both the code of the product and the quantity you want to buy.');
    }

    const productCode = args[0];
    const quantity = parseInt(args[1]);
    const discordId = message.author.id; 

    const logChannel = message.guild.channels.cache.get(buylogChannelId);

    if (isNaN(quantity) || quantity <= 0) {
      return message.reply('Please provide a valid quantity greater than 0.');
    }

    try {
      let purchasedAccounts = [];
      const user = await User.findOne({ discordId });

      if (!user) {
        return message.reply('You need to set your GrowID using the `.set` command first.');
      }

      const product = await Product.findOne({ code: productCode });

      if (!product) {
        return message.reply('This product does not exist.');
      }

      if (!product.variations || product.variations.length === 0) {
        return message.reply('There are no product details available for this product.');
      }

      if (product.stock < quantity) {
        return message.reply(`There is not enough stock to purchase ${quantity} of this product.`);
      }

      const totalPrice = product.price * quantity;

      if (user.balance < totalPrice) {
        return message.reply('You do not have enough balance to purchase this quantity of the product.');
      }

      switch (product.type) {
        case 'yes':
          await handleYesType(user, message, product, quantity);
          break;

        case 'no':
        case 'df': {
          if (product.variations.length < quantity) {
            return message.reply(`There are only **${product.variations.length} ${product.name}** available for purchase.`);
          }

          purchasedAccounts = [];
          const randomIndexes = [];
          
          for (let i = 0; i < quantity; i++) {
            let randomIndex;
            do {
              randomIndex = Math.floor(Math.random() * product.variations.length);
            } while (randomIndexes.includes(randomIndex));
            
            randomIndexes.push(randomIndex);
            purchasedAccounts.push(product.variations[randomIndex]);
          }

          product.variations = product.variations.filter((_, index) => !randomIndexes.includes(index));
          product.stock -= quantity;
          await product.save();
          purchaseEmitter.emit('purchase');

          const detailsMessage = purchasedAccounts.join('\n\n\n');
          const fileName = `${user.growId}.txt`;

          fs.writeFileSync(fileName, detailsMessage);

          const embedDM = new EmbedBuilder()
            .setColor('#007fff')
            .setTitle('Purchase Successful')
            .setDescription(`You have purchased: **${product.name.replace(/"/g, '')}**\nAmount: **${quantity}**\nTotal Price: **${totalPrice} ${wlEmoji}**\n✅ **Don't forget to give reps!**`)
            .setImage(imageURL)
            .setTimestamp();

          await message.author.send({ embeds: [embedDM], files: [fileName] });
          fs.unlinkSync(fileName);
          break;
        }

        case 'autosend':
          await autosendFunction(user, message, product, quantity);
          break;

        default:
          return message.reply('This product type is not supported.');
      }

      await product.save();
      user.balance -= totalPrice;
      await user.save();

      orderCount = await getOrderCount();
      orderCount++;
      await OrderCount.findOneAndUpdate({}, { count: orderCount }, { upsert: true });

      purchaseEmitter.emit('purchase');

      const roleToAdd = message.guild.roles.cache.get(product.roleToadd);
      if (roleToAdd) {
        await message.member.roles.add(roleToAdd);
      }

      const purchaseLogEmbed = new EmbedBuilder()
        .setColor('#007fff')
        .setTitle(`Order Number: **${orderCount}**`)
        .setDescription(`${emoji1} Buyer: <@${message.author.id}>
${emoji1} Product: **${product.name.replace(/"/g, '')}**
${emoji1} Code: **${product.code}**
${emoji1} Total Price: **${totalPrice}** ${wlEmoji}`)
        .setImage(imageURL)
        .setTimestamp();

      if (logChannel) {
        logChannel.send({ embeds: [purchaseLogEmbed] });
      }

      const purchaseConfirmationEmbed = new EmbedBuilder()
        .setColor('#007fff')
        .setTitle('Purchase Successful')
        .setDescription(`You have successfully purchased **${quantity} ${product.name}.** Please Check your DM!`)
        .setTimestamp();

      message.reply({ embeds: [purchaseConfirmationEmbed] })
        .then(() => {
          const delayBeforeWarning = 10000;
          setTimeout(() => {
            if (message.channel) {
              console.log('Successfully sent purchase confirmation message.');
            }
          }, 1000);
        })
        .catch(error => {
          console.error('Error:', error);
          return message.reply('Something went wrong.');
        });

    } catch (error) {
      console.error('Error:', error);
      return message.reply('Something went wrong.');
    }
  }
};

async function autosendFunction(user, message, product, quantity) {
  // Customize this function to handle autosend products
  // For example, send the purchased product directly to the user here
}

// Define an asynchronous function to handle the "yes" type
async function handleYesType(user, message, product, quantity) {
  // Check if there's enough stock to buy
    const totalPrice = product.price * quantity;

  const randomDetails = [];
  for (let i = 0; i < quantity; i++) {
    const randomIndex = Math.floor(Math.random() * product.variations.length);
    randomDetails.push(product.variations[randomIndex]);
  }



  // Update the stock count accordingly
  product.stock -= quantity;

  // Save the updated product to the database
  await product.save();

  // Emit the 'purchaseMade' event to trigger real-time stock update
  purchaseEmitter.emit('purchase');

  const detailsMessages = randomDetails.join('\n');
  const fileNames = `${user.growId}.txt`;

  // Create the details file
  fs.writeFileSync(fileNames, detailsMessages);

  // Send the file to the user
  const embedDMs = new EmbedBuilder()
    .setColor('#007fff')
    .setTitle('Purchase Successful')
    .setDescription(`You have purchased: **${product.name.replace(/"/g, '')}**\nAmount: **${quantity}**\nTotal Price: **${totalPrice} ${wlEmoji}**\n✅ **Don't forget to give reps!**`)

    .setImage(imageURL)
    .setTimestamp();
  await message.author.send({ embeds: [embedDMs], files: [fileNames] });

  // Delete the file after sending
  fs.unlinkSync(fileNames);
}