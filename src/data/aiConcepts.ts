import type { TreeNode } from '../types';

export const aiConceptsData: TreeNode = {
  id: "ai",
  name: "Artificial Intelligence (AI)",
  description: "The theory and development of computer systems able to perform tasks that normally require human intelligence. This encompasses a vast range of capabilities, from visual perception and speech recognition to complex decision-making and language translation. AI is not a single technology, but a broad field of study.",
  link: "https://en.wikipedia.org/wiki/Artificial_intelligence",
  children: [
    {
      id: "ml",
      name: "Machine Learning (ML)",
      description: "A foundational subfield of AI where algorithms are trained on data to learn patterns and make predictions without being explicitly programmed for the task. Instead of hand-coding rules, ML models infer relationships from the data itself. It is the engine behind most modern AI applications.",
      link: "https://en.wikipedia.org/wiki/Machine_learning",
      quiz: {
        question: "What is the primary goal of Supervised Learning?",
        options: [
          "To find hidden patterns in unlabeled data",
          "To learn a mapping from inputs to outputs using labeled data",
          "To learn through trial and error by maximizing a reward",
          "To reduce the number of features in a dataset"
        ],
        correctAnswer: "To learn a mapping from inputs to outputs using labeled data"
      },
      children: [
        {
          id: "supervised",
          name: "Supervised Learning",
          description: "The most common type of machine learning. The algorithm learns from a dataset where each data point is 'labeled' with the correct output. The goal is to learn a general rule that maps inputs to outputs. It's 'supervised' because the correct answers are provided during training.",
          children: [
            { 
              id: "regression",
              name: "Regression",
              description: "A supervised learning task used to predict a continuous numerical value, like predicting a house price or stock value."
            },
            {
              id: "classification",
              name: "Classification",
              description: "A supervised learning task used to predict a discrete category or class, such as classifying an email as 'spam' or 'not spam'."
            },
          ],
        },
        {
          id: "unsupervised",
          name: "Unsupervised Learning",
          description: "In this paradigm, the algorithm learns from data that has not been labeled or categorized. The system tries to learn the patterns and structure from the data directly, without any 'correct' answers to guide it. Common tasks include clustering and dimensionality reduction.",
          children: [
            {
              id: "clustering",
              name: "Clustering",
              description: "The task of grouping a set of objects in such a way that objects in the same group (cluster) are more similar to each other than to those in other groups."
            },
            {
              id: "dimensionality-reduction",
              name: "Dimensionality Reduction",
              description: "The process of reducing the number of random variables under consideration by obtaining a set of principal variables. It's often used to simplify data for easier processing and visualization."
            },
          ],
        },
        {
          id: "rl",
          name: "Reinforcement Learning (RL)",
          description: "An area of machine learning where an 'agent' learns to make decisions by performing actions in an environment to achieve some goal. The agent receives rewards or penalties for its actions, learning through trial and error to maximize its cumulative reward. This is the basis for training models to play games or control robots.",
          link: "https://en.wikipedia.org/wiki/Reinforcement_learning",
        },
        {
          id: "dl",
          name: "Deep Learning (DL)",
          description: "A powerful subfield of ML based on artificial neural networks with many layers (hence 'deep'). These deep architectures allow models to learn highly complex, hierarchical patterns from vast amounts of data. Deep Learning is the driving force behind recent breakthroughs in computer vision and NLP.",
          link: "https://en.wikipedia.org/wiki/Deep_learning",
          quiz: {
            question: "Which neural network architecture is primarily used for image processing tasks?",
            options: [
              "Recurrent Neural Networks (RNNs)",
              "Transformers",
              "Convolutional Neural Networks (CNNs)",
              "Autoencoders"
            ],
            correctAnswer: "Convolutional Neural Networks (CNNs)"
          },
          children: [
            { id: "ann", name: "Artificial Neural Networks (ANNs)", description: "The foundational concept of deep learning, also known as Feedforward Neural Networks (FNNs), inspired by the structure of biological neurons in the human brain." },
            {
              id: "cnn",
              name: "Convolutional Neural Networks (CNNs)",
              description: "A class of deep neural networks specialized for processing data with a grid-like topology, such as an image. CNNs use special 'convolutional' layers to automatically and adaptively learn spatial hierarchies of features, from edges and textures to more complex objects.",
            },
            {
              id: "rnn",
              name: "Recurrent Neural Networks (RNNs)",
              description: "A class of neural networks designed to work with sequential data like text or time series. They have 'memory' because connections between nodes form a directed graph along a sequence, allowing information to persist.",
              children: [
                { id: "lstm", name: "Long Short-Term Memory (LSTM)" },
                { id: "gru", name: "Gated Recurrent Units (GRU)" }
              ]
            },
            {
              id: "transformers",
              name: "Transformers",
              description: "A revolutionary architecture based on the 'self-attention' mechanism, which allows it to weigh the importance of different words in the input data. Unlike RNNs, it processes all input tokens at once, enabling massive parallelization and leading to state-of-the-art performance in virtually all NLP tasks.",
              link: "https://en.wikipedia.org/wiki/Transformer_(machine_learning_model)",
              quiz: {
                question: "What is the core mechanism behind the Transformer architecture?",
                options: [
                  "Convolutional Layers",
                  "Recurrent Connections",
                  "Self-Attention",
                  "Clustering"
                ],
                correctAnswer: "Self-Attention"
              },
            },
            {
              id: "gan",
              name: "Generative Adversarial Networks (GANs)",
              description: "A class of generative models where two neural networks, a 'Generator' and a 'Discriminator', compete against each other. The Generator creates fake data, and the Discriminator tries to distinguish it from real data. This adversarial process results in the creation of highly realistic synthetic data, like images or text.",
            },
          ],
        },
      ],
    },
    {
      id: "symbolic",
      name: "Symbolic AI (GOFAI)",
      description: "Good Old-Fashioned AI; a collective term for methods in AI research based on high-level symbolic (human-readable) representations of problems, logic, and search. This was the dominant paradigm in AI from the 1950s through the 1980s.",
      children: [
        { id: "expert-systems", name: "Expert Systems" },
        { id: "logic-programming", name: "Logic Programming" },
        { id: "knowledge-based", name: "Knowledge-Based Systems" },
      ],
    },
    {
      id: "applications",
      name: "Key Application Fields",
      description: "Major fields that are not subfields of AI but heavily utilize AI, ML, and DL techniques to solve domain-specific problems.",
      children: [
        {
          id: "cv",
          name: "Computer Vision (CV)",
          isApplication: true,
          description: "An interdisciplinary field that deals with how computers can be made to gain high-level understanding from digital images or videos. It heavily utilizes CNNs and, more recently, Vision Transformers.",
          link: "https://en.wikipedia.org/wiki/Computer_vision",
        },
        {
          id: "nlp",
          name: "Natural Language Processing (NLP)",
          isApplication: true,
          description: "A subfield of AI focused on enabling computers to understand, interpret, and generate human language. Its evolution has been driven by RNNs and, more significantly, by Transformers, which power Large Language Models (LLMs).",
          link: "https://en.wikipedia.org/wiki/Natural_language_processing",
          children: [
            { id: "llm", name: "Large Language Models (LLMs)" }
          ]
        },
        {
          id: "speech-recognition",
          name: "Speech Recognition",
          isApplication: true,
          description: "The task of converting spoken language into written text, also known as automatic speech recognition (ASR) or speech-to-text.",
        }
      ]
    }
  ]
};