import type { TreeNode } from '../types';

export const aiConceptsData: TreeNode = {
  id: "ai",
  name: "Artificial Intelligence (AI)",
  description: "The theory and development of computer systems able to perform tasks that normally require human intelligence, including visual perception, speech recognition, decision-making, and language translation.",
  detailedDescription: "Artificial Intelligence is not a single technology but a broad field of study spanning decades of research. Modern AI draws from computer science, mathematics, cognitive science, neuroscience, and philosophy. The field has evolved through several paradigms: from symbolic reasoning in the 1950s-80s, to statistical machine learning in the 1990s-2000s, to the deep learning revolution of the 2010s. Today, foundation models trained on massive datasets represent the frontier, with implications for nearly every domain of human activity.",
  link: "https://en.wikipedia.org/wiki/Artificial_intelligence",
  resources: [
    { title: "Stanford HAI Annual Report", url: "https://aiindex.stanford.edu/report/", type: "paper" },
    { title: "MIT Introduction to Deep Learning", url: "https://www.youtube.com/watch?v=ErnWZxJovaM", type: "video" },
  ],
  children: [
    {
      id: "ml",
      name: "Machine Learning (ML)",
      description: "A subfield of AI where algorithms learn patterns from data to make predictions, without being explicitly programmed for the task. It is the engine behind most modern AI applications.",
      detailedDescription: "Machine learning fundamentally shifts the programming paradigm: instead of writing rules by hand, we provide examples and let the algorithm discover the rules itself. This process involves three key ingredients: a dataset to learn from, a model architecture that defines the hypothesis space, and an optimization algorithm that searches for the best parameters. The field is typically divided into supervised learning (labeled data), unsupervised learning (finding structure), and reinforcement learning (learning from interaction).",
      mathNotation: "\\hat{y} = f(x; \\theta) \\quad \\text{where } \\theta^* = \\arg\\min_\\theta \\mathcal{L}(f(x;\\theta), y)",
      link: "https://en.wikipedia.org/wiki/Machine_learning",
      quiz: {
        question: "What is the primary goal of supervised learning?",
        options: [
          "To find hidden patterns in unlabeled data",
          "To learn a mapping from inputs to outputs using labeled data",
          "To learn through trial and error by maximizing a reward",
          "To reduce the number of features in a dataset"
        ],
        correctAnswer: "To learn a mapping from inputs to outputs using labeled data",
        explanation: "Supervised learning uses labeled training examples — pairs of inputs and their correct outputs — to learn a general function that maps new inputs to predicted outputs. The 'supervision' comes from the labels that guide the learning process."
      },
      resources: [
        { title: "Coursera: Machine Learning (Andrew Ng)", url: "https://www.coursera.org/learn/machine-learning", type: "tutorial" },
        { title: "A Visual Introduction to ML", url: "http://www.r2d3.us/visual-intro-to-machine-learning-part-1/", type: "tutorial" },
      ],
      children: [
        {
          id: "supervised",
          name: "Supervised Learning",
          description: "The most common ML paradigm. The algorithm learns from labeled data where each example includes the correct output, learning to generalize the input-output mapping to unseen data.",
          detailedDescription: "In supervised learning, the training dataset consists of input-output pairs (x, y). The algorithm's goal is to learn a function f such that f(x) closely approximates y for new, unseen inputs. The quality of this approximation is measured by a loss function, and training proceeds by minimizing this loss. Two main tasks fall under supervised learning: regression (predicting continuous values) and classification (predicting discrete categories).",
          quiz: {
            question: "Which of these is an example of a classification task?",
            options: [
              "Predicting tomorrow's temperature",
              "Estimating a home's sale price",
              "Determining if an email is spam or not spam",
              "Forecasting stock market returns"
            ],
            correctAnswer: "Determining if an email is spam or not spam",
            explanation: "Classification predicts a discrete category (spam vs. not spam), while the other options involve predicting continuous numerical values, which are regression tasks."
          },
          children: [
            {
              id: "regression",
              name: "Regression",
              description: "Predicting a continuous numerical output, such as a house price, temperature, or stock value. The model learns a function that maps inputs to a point on a continuous number line.",
              detailedDescription: "Linear regression, the simplest form, fits a line (or hyperplane) to the data by minimizing the sum of squared errors between predictions and actual values. More complex forms include polynomial regression, ridge regression (L2 regularization), and lasso regression (L1 regularization). The key metric is typically Mean Squared Error (MSE) or R-squared.",
              mathNotation: "\\hat{y} = w_0 + w_1 x_1 + w_2 x_2 + \\cdots + w_n x_n",
              interactiveModule: "gradient-descent",
              quiz: {
                question: "What does the Mean Squared Error (MSE) measure?",
                options: [
                  "The average of the absolute differences between predictions and actual values",
                  "The average of the squared differences between predictions and actual values",
                  "The percentage of correct predictions",
                  "The correlation between input features"
                ],
                correctAnswer: "The average of the squared differences between predictions and actual values",
                explanation: "MSE = (1/n) * sum of (predicted - actual)^2. Squaring the errors penalizes large errors more heavily than small ones, making it sensitive to outliers."
              },
            },
            {
              id: "classification",
              name: "Classification",
              description: "Predicting a discrete category or class label, such as spam vs. not-spam, or identifying a digit in a handwritten image. The output is one of a fixed set of categories.",
              detailedDescription: "Classification algorithms learn decision boundaries that separate different classes in the feature space. Common algorithms include logistic regression (despite its name), decision trees, random forests, support vector machines (SVMs), and neural networks. For two classes, the model typically outputs a probability, and a threshold determines the final prediction.",
              mathNotation: "P(y=1|x) = \\sigma(w^T x + b) = \\frac{1}{1 + e^{-(w^T x + b)}}",
              quiz: {
                question: "What is the purpose of the sigmoid function in logistic regression?",
                options: [
                  "To compute the mean squared error",
                  "To map any real number to a probability between 0 and 1",
                  "To select the most important features",
                  "To normalize the input data"
                ],
                correctAnswer: "To map any real number to a probability between 0 and 1",
                explanation: "The sigmoid function sigma(z) = 1/(1+e^-z) squashes any real-valued input into the range (0, 1), which can be interpreted as a probability of belonging to the positive class."
              },
            },
          ],
        },
        {
          id: "unsupervised",
          name: "Unsupervised Learning",
          description: "Learning patterns and structure from data that has no labels. The algorithm must discover the underlying organization of the data on its own, without any guidance about correct answers.",
          detailedDescription: "Without labels to guide learning, unsupervised algorithms must find structure in the data itself. This includes discovering natural groupings (clustering), reducing complexity while preserving important information (dimensionality reduction), learning the probability distribution of the data (density estimation), and finding interesting patterns (association rules). These methods are valuable for exploratory data analysis and as preprocessing steps.",
          quiz: {
            question: "Why is unsupervised learning called 'unsupervised'?",
            options: [
              "Because the algorithm runs without any human intervention",
              "Because the training data does not include correct output labels",
              "Because it does not use gradient descent",
              "Because it only works on numerical data"
            ],
            correctAnswer: "Because the training data does not include correct output labels",
            explanation: "The term 'unsupervised' refers to the absence of labeled outputs in the training data. There is no 'supervisor' providing correct answers — the algorithm must find patterns and structure on its own."
          },
          children: [
            {
              id: "clustering",
              name: "Clustering",
              description: "Grouping data points so that items in the same cluster are more similar to each other than to items in other clusters. Used in customer segmentation, document organization, and anomaly detection.",
              detailedDescription: "K-Means, the most common clustering algorithm, partitions data into k groups by iteratively assigning points to the nearest centroid and updating centroids. Other approaches include hierarchical clustering (building a tree of clusters), DBSCAN (density-based, handles arbitrary shapes), and Gaussian Mixture Models (probabilistic soft clustering).",
              quiz: {
                question: "In K-Means clustering, what does 'K' represent?",
                options: [
                  "The number of features in the dataset",
                  "The number of clusters to create",
                  "The number of iterations to run",
                  "The distance threshold for grouping"
                ],
                correctAnswer: "The number of clusters to create",
                explanation: "K is the number of clusters the algorithm will partition the data into. It must be specified before running the algorithm, and choosing the right K is itself an important problem (often addressed with methods like the elbow method or silhouette analysis)."
              },
            },
            {
              id: "dimensionality-reduction",
              name: "Dimensionality Reduction",
              description: "Reducing the number of variables in a dataset while preserving its essential structure. Used for visualization, noise reduction, and making other algorithms more efficient.",
              detailedDescription: "High-dimensional data is difficult to visualize and often contains redundant or noisy features. Principal Component Analysis (PCA) finds new axes (principal components) that capture the maximum variance in the data, allowing projection to fewer dimensions with minimal information loss. t-SNE and UMAP are nonlinear methods especially useful for visualizing high-dimensional data in 2D or 3D.",
              mathNotation: "X_{\\text{reduced}} = X \\cdot W_k \\quad \\text{where } W_k \\text{ are the top-}k \\text{ eigenvectors of } X^T X",
            },
          ],
        },
        {
          id: "rl",
          name: "Reinforcement Learning (RL)",
          description: "An agent learns to make decisions by interacting with an environment, receiving rewards or penalties for its actions. It learns through trial and error to maximize cumulative reward over time.",
          detailedDescription: "RL is fundamentally different from supervised learning: there are no labeled examples. Instead, an agent takes actions in an environment, observes the resulting state and reward, and adjusts its policy to maximize long-term reward. Key concepts include the exploration-exploitation tradeoff (trying new things vs. exploiting known good strategies), the Markov Decision Process formalization, and the distinction between model-free methods (Q-learning, policy gradient) and model-based methods.",
          mathNotation: "Q(s,a) \\leftarrow Q(s,a) + \\alpha \\left[ r + \\gamma \\max_{a'} Q(s',a') - Q(s,a) \\right]",
          link: "https://en.wikipedia.org/wiki/Reinforcement_learning",
          quiz: {
            question: "What is the exploration-exploitation tradeoff in reinforcement learning?",
            options: [
              "Choosing between supervised and unsupervised learning",
              "Balancing trying new actions vs. using known good actions",
              "Deciding whether to increase or decrease the learning rate",
              "Trading off between training speed and model accuracy"
            ],
            correctAnswer: "Balancing trying new actions vs. using known good actions",
            explanation: "An RL agent must balance exploitation (choosing actions known to give high reward) with exploration (trying new actions that might yield even higher reward). Too much exploitation can cause the agent to miss better strategies; too much exploration wastes time on poor actions."
          },
          resources: [
            { title: "Spinning Up in Deep RL (OpenAI)", url: "https://spinningup.openai.com/", type: "tutorial" },
          ],
        },
        {
          id: "dl",
          name: "Deep Learning (DL)",
          description: "A subfield of ML using artificial neural networks with many layers to learn complex hierarchical patterns. Deep learning drives breakthroughs in computer vision, NLP, and generative AI.",
          detailedDescription: "Deep learning's power comes from composing many layers of simple nonlinear transformations. Each layer learns to represent the data at a different level of abstraction: early layers in an image network might detect edges, middle layers detect textures and shapes, and later layers detect objects. This hierarchical feature learning, combined with massive datasets and GPU computing, has led to superhuman performance in tasks like image recognition and game playing.",
          mathNotation: "h^{(l)} = \\sigma(W^{(l)} h^{(l-1)} + b^{(l)})",
          link: "https://en.wikipedia.org/wiki/Deep_learning",
          quiz: {
            question: "Which neural network architecture is primarily used for image processing tasks?",
            options: [
              "Recurrent Neural Networks (RNNs)",
              "Transformers",
              "Convolutional Neural Networks (CNNs)",
              "Autoencoders"
            ],
            correctAnswer: "Convolutional Neural Networks (CNNs)",
            explanation: "CNNs use convolutional layers that scan small regions of an image with learnable filters, making them naturally suited for spatial data. They automatically learn hierarchical features — from edges to textures to objects — without requiring hand-crafted feature engineering."
          },
          resources: [
            { title: "Deep Learning Book (Goodfellow et al.)", url: "https://www.deeplearningbook.org/", type: "tutorial" },
            { title: "3Blue1Brown: Neural Networks", url: "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi", type: "video" },
          ],
          children: [
            {
              id: "ann",
              name: "Artificial Neural Networks (ANNs)",
              description: "The foundational architecture of deep learning: layers of interconnected nodes (neurons) that transform inputs through weighted connections and nonlinear activation functions.",
              detailedDescription: "A feedforward neural network consists of an input layer, one or more hidden layers, and an output layer. Each neuron computes a weighted sum of its inputs, adds a bias term, and applies a nonlinear activation function. Training uses backpropagation: computing the gradient of the loss with respect to each weight, then updating weights via gradient descent. The universal approximation theorem guarantees that a sufficiently wide network can approximate any continuous function.",
              mathNotation: "z = \\sum_{i} w_i x_i + b, \\quad a = \\sigma(z)",
              interactiveModule: "neural-network",
              quiz: {
                question: "What does the activation function do in a neural network?",
                options: [
                  "It initializes the weights randomly",
                  "It introduces nonlinearity, allowing the network to learn complex patterns",
                  "It reduces the number of parameters",
                  "It normalizes the input data"
                ],
                correctAnswer: "It introduces nonlinearity, allowing the network to learn complex patterns",
                explanation: "Without activation functions, a neural network would be equivalent to a single linear transformation regardless of depth. Nonlinear activations (ReLU, sigmoid, tanh) allow the network to learn complex, nonlinear decision boundaries."
              },
            },
            {
              id: "cnn",
              name: "Convolutional Neural Networks (CNNs)",
              description: "Networks specialized for grid-like data such as images. Convolutional layers scan input with learnable filters to automatically extract spatial features at multiple scales.",
              detailedDescription: "CNNs exploit the spatial structure of images through three key ideas: local connectivity (each neuron only connects to a small region), weight sharing (the same filter is applied across the entire image), and pooling (downsampling to achieve translation invariance). A typical CNN alternates convolutional layers (feature extraction) with pooling layers (spatial reduction), followed by fully connected layers for classification. Architectures like ResNet, VGG, and EfficientNet have achieved remarkable results in image recognition.",
              mathNotation: "(f * g)(i,j) = \\sum_m \\sum_n f(m,n) \\cdot g(i-m, j-n)",
              quiz: {
                question: "What is the main advantage of weight sharing in CNNs?",
                options: [
                  "It makes training faster by using fewer parameters",
                  "It ensures the network never overfits",
                  "It allows the network to detect the same feature anywhere in the image",
                  "It eliminates the need for pooling layers"
                ],
                correctAnswer: "It allows the network to detect the same feature anywhere in the image",
                explanation: "By sharing the same filter weights across all spatial positions, a CNN can detect a feature (like an edge or texture) regardless of where it appears in the image. This property is called translation equivariance and dramatically reduces the number of parameters."
              },
            },
            {
              id: "rnn",
              name: "Recurrent Neural Networks (RNNs)",
              description: "Networks designed for sequential data like text and time series. Connections form cycles, allowing information to persist across time steps and giving the network a form of memory.",
              detailedDescription: "RNNs process sequences one element at a time, maintaining a hidden state that acts as memory of what has been seen so far. At each time step, the hidden state is updated based on the current input and the previous hidden state. While theoretically powerful, basic RNNs struggle with long sequences due to vanishing and exploding gradients — a problem addressed by LSTM and GRU architectures.",
              mathNotation: "h_t = \\tanh(W_{hh} h_{t-1} + W_{xh} x_t + b_h)",
              children: [
                {
                  id: "lstm",
                  name: "Long Short-Term Memory (LSTM)",
                  description: "An RNN architecture with gating mechanisms (forget, input, output gates) that control information flow, solving the vanishing gradient problem and enabling learning of long-range dependencies.",
                  mathNotation: "f_t = \\sigma(W_f [h_{t-1}, x_t] + b_f), \\quad i_t = \\sigma(W_i [h_{t-1}, x_t] + b_i)",
                },
                {
                  id: "gru",
                  name: "Gated Recurrent Units (GRU)",
                  description: "A simplified gating architecture that combines the forget and input gates into a single update gate. Achieves similar performance to LSTM with fewer parameters.",
                }
              ]
            },
            {
              id: "transformers",
              name: "Transformers",
              description: "A revolutionary architecture based on self-attention that processes all input tokens simultaneously. Transformers power GPT, BERT, and virtually all modern language models.",
              detailedDescription: "Introduced in the 2017 paper 'Attention Is All You Need,' transformers replaced recurrence with self-attention: a mechanism where each token computes attention weights to every other token, determining how much to 'attend to' each one. This enables massive parallelization and captures long-range dependencies effectively. The architecture consists of encoder and decoder stacks, each with multi-head attention layers and feedforward networks, connected by residual connections and layer normalization.",
              mathNotation: "\\text{Attention}(Q,K,V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V",
              interactiveModule: "attention",
              link: "https://en.wikipedia.org/wiki/Transformer_(machine_learning_model)",
              quiz: {
                question: "What is the core mechanism behind the Transformer architecture?",
                options: [
                  "Convolutional Layers",
                  "Recurrent Connections",
                  "Self-Attention",
                  "Clustering"
                ],
                correctAnswer: "Self-Attention",
                explanation: "Self-attention allows each token in the input to attend to every other token, computing a weighted combination based on relevance. This replaces the sequential processing of RNNs with fully parallel computation, enabling transformers to capture long-range dependencies efficiently."
              },
              resources: [
                { title: "Attention Is All You Need (Vaswani et al., 2017)", url: "https://arxiv.org/abs/1706.03762", type: "paper" },
                { title: "The Illustrated Transformer", url: "https://jalammar.github.io/illustrated-transformer/", type: "tutorial" },
                { title: "Transformer Explainer (Polo Club)", url: "https://poloclub.github.io/transformer-explainer/", type: "tool" },
              ],
            },
            {
              id: "gan",
              name: "Generative Adversarial Networks (GANs)",
              description: "Two neural networks — a Generator and a Discriminator — compete in a game. The Generator creates synthetic data while the Discriminator tries to distinguish real from fake, producing highly realistic outputs.",
              detailedDescription: "GANs frame generative modeling as a two-player minimax game. The Generator G maps random noise z to synthetic data G(z), while the Discriminator D tries to distinguish real data x from generated data G(z). Training alternates between improving D (better detection) and improving G (better faking). At equilibrium, G produces data indistinguishable from real data. Variants include DCGAN (convolutional), StyleGAN (high-quality faces), and CycleGAN (unpaired image-to-image translation).",
              mathNotation: "\\min_G \\max_D \\; \\mathbb{E}_{x}[\\log D(x)] + \\mathbb{E}_{z}[\\log(1-D(G(z)))]",
              quiz: {
                question: "In a GAN, what is the Generator's objective?",
                options: [
                  "To correctly classify real vs. fake data",
                  "To create synthetic data that fools the Discriminator",
                  "To minimize the classification accuracy",
                  "To compress the input data"
                ],
                correctAnswer: "To create synthetic data that fools the Discriminator",
                explanation: "The Generator's goal is to produce synthetic data so realistic that the Discriminator cannot tell it apart from real data. This adversarial dynamic drives both networks to improve continuously."
              },
            },
          ],
        },
      ],
    },
    {
      id: "symbolic",
      name: "Symbolic AI (GOFAI)",
      description: "Good Old-Fashioned AI — methods based on human-readable symbolic representations, logic, and search. The dominant AI paradigm from the 1950s through the 1980s.",
      detailedDescription: "Symbolic AI operates on the physical symbol system hypothesis: that intelligent behavior can be achieved through the manipulation of symbolic expressions. Knowledge is represented explicitly as rules, frames, or logical statements, and reasoning proceeds through search and inference. While less prominent today, symbolic methods remain valuable for tasks requiring explainability, formal verification, and structured knowledge representation.",
      quiz: {
        question: "Why did symbolic AI decline in prominence relative to machine learning?",
        options: [
          "Symbolic AI was proven to be mathematically incorrect",
          "It struggled with uncertainty, learning from data, and scaling to complex real-world problems",
          "Machine learning was invented before symbolic AI",
          "Symbolic AI cannot run on modern hardware"
        ],
        correctAnswer: "It struggled with uncertainty, learning from data, and scaling to complex real-world problems",
        explanation: "Symbolic AI requires humans to manually encode knowledge as rules, which becomes intractable for complex domains. It also struggles with noisy, uncertain, or ambiguous data — precisely where statistical ML excels by learning patterns directly from examples."
      },
      children: [
        {
          id: "expert-systems",
          name: "Expert Systems",
          description: "Programs that emulate the decision-making of a human expert using a knowledge base of if-then rules. Widely deployed in the 1980s for medical diagnosis, financial planning, and equipment configuration.",
        },
        {
          id: "logic-programming",
          name: "Logic Programming",
          description: "Programming paradigm based on formal logic, where programs consist of logical statements and computation is performed through logical inference. Prolog is the most well-known language.",
        },
        {
          id: "knowledge-based",
          name: "Knowledge-Based Systems",
          description: "Systems that use explicitly represented knowledge (ontologies, semantic networks, frames) to reason about a domain. Modern descendants include knowledge graphs used by Google and Wikidata.",
        },
      ],
    },
    {
      id: "applications",
      name: "Key Application Fields",
      description: "Major domains that heavily utilize AI, ML, and DL techniques to solve domain-specific problems, spanning perception, language, and physical interaction.",
      children: [
        {
          id: "cv",
          name: "Computer Vision (CV)",
          isApplication: true,
          description: "Enabling computers to interpret and understand visual information from images and video. Powered primarily by CNNs and Vision Transformers.",
          detailedDescription: "Computer vision encompasses tasks of increasing complexity: image classification (what is in the image?), object detection (where are the objects?), semantic segmentation (which pixels belong to which class?), and scene understanding (what is happening?). Recent advances include vision transformers (ViT), which apply the transformer architecture to image patches, and multimodal models that combine vision with language understanding.",
          link: "https://en.wikipedia.org/wiki/Computer_vision",
          quiz: {
            question: "Which task involves identifying both the class and location of objects in an image?",
            options: [
              "Image classification",
              "Object detection",
              "Style transfer",
              "Image generation"
            ],
            correctAnswer: "Object detection",
            explanation: "Object detection combines classification (what) with localization (where), typically outputting bounding boxes around detected objects along with their class labels and confidence scores."
          },
        },
        {
          id: "nlp",
          name: "Natural Language Processing (NLP)",
          isApplication: true,
          description: "Enabling computers to understand, interpret, and generate human language. Modern NLP is dominated by transformer-based models like GPT and BERT.",
          detailedDescription: "NLP spans a wide range of tasks: text classification, named entity recognition, machine translation, question answering, summarization, and open-ended generation. The field was transformed by the introduction of pre-trained language models — first word2vec and GloVe for word embeddings, then ELMo and BERT for contextual representations, and finally GPT-style autoregressive models that can generate fluent text and follow complex instructions.",
          link: "https://en.wikipedia.org/wiki/Natural_language_processing",
          quiz: {
            question: "What breakthrough did word2vec introduce to NLP?",
            options: [
              "The ability to translate between any two languages",
              "Dense vector representations where similar words have similar embeddings",
              "Perfect grammar checking for all languages",
              "The first chatbot capable of conversation"
            ],
            correctAnswer: "Dense vector representations where similar words have similar embeddings",
            explanation: "Word2vec learned to map words to dense vectors in a continuous space where semantic relationships are preserved — famously, vector('king') - vector('man') + vector('woman') is close to vector('queen')."
          },
          children: [
            {
              id: "llm",
              name: "Large Language Models (LLMs)",
              description: "Transformer-based models trained on massive text corpora that can generate, understand, and reason about natural language. Examples include GPT-4, Claude, and Gemini.",
              detailedDescription: "LLMs are trained with a simple objective — predict the next token — but at sufficient scale, this produces emergent capabilities: in-context learning, chain-of-thought reasoning, code generation, and more. The scaling laws discovered by Kaplan et al. (2020) show that model performance improves predictably with more parameters, data, and compute. Fine-tuning techniques like RLHF (Reinforcement Learning from Human Feedback) align these models with human preferences.",
              quiz: {
                question: "What is the basic training objective of most large language models?",
                options: [
                  "Answering questions correctly",
                  "Predicting the next token in a sequence",
                  "Classifying text into categories",
                  "Translating between languages"
                ],
                correctAnswer: "Predicting the next token in a sequence",
                explanation: "Most LLMs are trained with next-token prediction (autoregressive language modeling). Despite this simple objective, training at massive scale on diverse text produces broad capabilities that emerge from the statistical patterns in language."
              },
            }
          ]
        },
        {
          id: "speech-recognition",
          name: "Speech Recognition",
          isApplication: true,
          description: "Converting spoken language into written text (ASR). Modern systems use end-to-end deep learning, with models like Whisper achieving near-human accuracy across many languages.",
        }
      ]
    }
  ]
};
