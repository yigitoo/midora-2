import { storage } from './storage';

// Function to generate mock forum data
export async function generateMockForumData() {
  console.log('Generating mock forum data...');
  
  try {
    // Create categories
    const categories = [
      { name: 'Stock Market News', description: 'Latest news affecting global markets', order: 1, isSubcategory: false },
      { name: 'Stock Analysis', description: 'Technical and fundamental analysis of stocks', order: 2, isSubcategory: false },
      { name: 'Investment Strategies', description: 'Long-term and short-term investment approaches', order: 3, isSubcategory: false },
      { name: 'Trading Techniques', description: 'Day trading, swing trading, and other trading methods', order: 4, isSubcategory: false },
      { name: 'Crypto Discussion', description: 'Cryptocurrency markets and blockchain technologies', order: 5, isSubcategory: false },
      { name: 'Platform Feedback', description: 'Suggestions and feedback for the Midora platform', order: 6, isSubcategory: false },
    ];
    
    // Add subcategories
    const subcategories = [
      { name: 'US Markets', description: 'NYSE, NASDAQ, and other US exchanges', order: 1, isSubcategory: true, parentId: 1 },
      { name: 'International Markets', description: 'Markets outside the US', order: 2, isSubcategory: true, parentId: 1 },
      { name: 'Earnings Reports', description: 'Company earnings and financial reports', order: 3, isSubcategory: true, parentId: 1 },
      { name: 'Technical Analysis', description: 'Chart patterns and technical indicators', order: 1, isSubcategory: true, parentId: 2 },
      { name: 'Fundamental Analysis', description: 'Company valuations and financial health', order: 2, isSubcategory: true, parentId: 2 },
      { name: 'Growth Stocks', description: 'High-growth potential companies', order: 1, isSubcategory: true, parentId: 3 },
      { name: 'Dividend Investing', description: 'Stocks that pay regular dividends', order: 2, isSubcategory: true, parentId: 3 },
      { name: 'ETFs and Funds', description: 'Exchange-traded funds and mutual funds', order: 3, isSubcategory: true, parentId: 3 },
      { name: 'Day Trading', description: 'Strategies for intraday trading', order: 1, isSubcategory: true, parentId: 4 },
      { name: 'Swing Trading', description: 'Multi-day position trading', order: 2, isSubcategory: true, parentId: 4 },
    ];
    
    const createdCategories = [];
    
    // Create main categories
    for (const category of categories) {
      const createdCategory = await storage.createForumCategory(category);
      createdCategories.push(createdCategory);
      console.log(`Created category: ${createdCategory.name}`);
    }
    
    // Create subcategories
    for (const subcategory of subcategories) {
      const createdSubcategory = await storage.createForumCategory(subcategory);
      createdCategories.push(createdSubcategory);
      console.log(`Created subcategory: ${createdSubcategory.name}`);
    }
    
    // Create topics and replies
    const topics = [
      {
        categoryId: 1, // Stock Market News
        userId: 1,
        title: 'Fed Announces Interest Rate Decision',
        content: 'The Federal Reserve announced today that interest rates will remain unchanged at 5.25%. What impact do you think this will have on the stock market in the coming weeks?',
      },
      {
        categoryId: 1, // Stock Market News
        userId: 1,
        title: 'Inflation Report Released Today',
        content: 'The latest inflation report shows a decrease to 3.2%, lower than expected. This could be positive for equities as it might mean the Fed will be less aggressive with rate hikes.',
      },
      {
        categoryId: 2, // Stock Analysis
        userId: 1,
        title: 'AAPL Technical Analysis - Potential Breakout Pattern',
        content: 'Apple (AAPL) is forming what appears to be a cup and handle pattern on the daily chart. The stock is approaching the breakout point around $185. If it clears this level with volume, we could see a move to $200+.',
      },
      {
        categoryId: 4, // Trading Techniques
        userId: 1,
        title: 'Using RSI for Momentum Trading',
        content: 'I\'ve been experimenting with using RSI (Relative Strength Index) to identify momentum trades. When RSI crosses above 50 with strong price action, it often indicates a good long entry. Has anyone else had success with this approach?',
      },
      {
        categoryId: 3, // Investment Strategies
        userId: 1,
        title: 'Building a Dividend Growth Portfolio',
        content: 'I\'m looking to build a portfolio focused on dividend growth stocks. Currently considering: JNJ, PG, KO, MSFT, and VZ as core positions. Anyone have other suggestions for reliable dividend growers with potential for capital appreciation?',
      },
    ];
    
    const createdTopics = [];
    
    // Create more topics for each subcategory
    for (const createdCategory of createdCategories) {
      if (createdCategory.isSubcategory) {
        const subcatTopics = [
          {
            categoryId: createdCategory.id,
            userId: 1,
            title: `Discussion: Latest trends in ${createdCategory.name}`,
            content: `Let's discuss the current trends and opportunities in ${createdCategory.name}. What are you all seeing in this space?`,
          },
          {
            categoryId: createdCategory.id,
            userId: 1,
            title: `Strategy Guide for ${createdCategory.name}`,
            content: `I've compiled a comprehensive guide for approaching ${createdCategory.name} based on my 5 years of experience. Would love feedback from others.`,
          },
          {
            categoryId: createdCategory.id,
            userId: 1,
            title: `Question about ${createdCategory.name}`,
            content: `I'm new to ${createdCategory.name} and wondering what resources and tools everyone recommends for beginners?`,
          },
        ];
        
        for (const topic of subcatTopics) {
          const createdTopic = await storage.createForumTopic(topic);
          createdTopics.push(createdTopic);
          console.log(`Created topic in ${createdCategory.name}: ${createdTopic.title}`);
          
          // Add views to make it look more natural
          const viewCount = Math.floor(Math.random() * 50) + 10;
          for (let i = 0; i < viewCount; i++) {
            await storage.incrementTopicViews(createdTopic.id);
          }
        }
      }
    }
    
    // Create topics from the main list
    for (const topic of topics) {
      const createdTopic = await storage.createForumTopic(topic);
      createdTopics.push(createdTopic);
      console.log(`Created topic: ${createdTopic.title}`);
      
      // Add views to make it look more natural
      const viewCount = Math.floor(Math.random() * 100) + 20;
      for (let i = 0; i < viewCount; i++) {
        await storage.incrementTopicViews(createdTopic.id);
      }
    }
    
    // Create replies for each topic
    const replies = [
      'This is a really insightful analysis, thanks for sharing!',
      'I have to disagree with your conclusion. The data suggests a different outcome.',
      'Has anyone else noticed similar patterns in related stocks?',
      'Great post! I have been following this for a while and your perspective adds new insight.',
      'What time frame are you looking at for this to play out?',
      'The market seems to be ignoring this news so far. Interesting to see if that changes.',
      'I have had success with a similar approach but with some modifications.',
      'This is exactly what I have been looking for. Thanks for the detailed breakdown!',
      'Have you considered the impact of macroeconomic factors on this strategy?',
      'I would add that timing is also crucial for this approach to work effectively.',
    ];
    
    for (const createdTopic of createdTopics) {
      // Add 2-5 replies to each topic
      const replyCount = Math.floor(Math.random() * 4) + 2;
      
      for (let i = 0; i < replyCount; i++) {
        const replyIndex = Math.floor(Math.random() * replies.length);
        const reply = {
          topicId: createdTopic.id,
          userId: 1,
          content: replies[replyIndex],
          isEdited: false,
        };
        
        const createdReply = await storage.createForumReply(reply);
        console.log(`Created reply for topic ${createdTopic.id}`);
      }
    }
    
    console.log('Mock forum data generation complete!');
    return {
      categories: createdCategories.length,
      topics: createdTopics.length,
      replies: createdTopics.length * 3 // Average number of replies
    };
  } catch (error) {
    console.error('Error generating mock forum data:', error);
    throw error;
  }
}