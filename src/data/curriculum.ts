import { ConceptNode } from '../types';

/**
 * Flat curriculum map — ~40 concepts across 5 tiers.
 * Hierarchy is encoded via prerequisites[] and connections[] arrays.
 */
export const curriculum: Record<string, ConceptNode> = {
  // =========================================================================
  // TIER 1 — Foundations
  // =========================================================================
  'data-preprocessing': {
    id: 'data-preprocessing',
    name: 'Data Preprocessing',
    description: 'Cleaning, transforming, and preparing raw data for machine learning models.',
    detailedDescription: 'Data preprocessing is the critical first step in any ML pipeline. Raw data is rarely suitable for direct use — it may contain missing values, outliers, inconsistent formats, or features on vastly different scales. Preprocessing techniques include normalization (scaling features to a common range), standardization (centering to zero mean and unit variance), outlier detection and removal, and handling missing data through imputation. The quality of preprocessing directly determines model performance.',
    mathNotation: 'z = \\frac{x - \\mu}{\\sigma} \\quad \\text{(z-score normalization)}',
    tier: 1,
    bloomLevel: 'apply',
    prerequisites: [],
    connections: ['feature-engineering', 'evaluation-metrics'],
    explorationId: 'data-preprocessing',
    quizzes: [
      { id: 'dp-1', question: 'What is the purpose of normalizing features?', difficulty: 1, type: 'multiple-choice', options: ['To make all values positive', 'To bring features to a comparable scale', 'To remove outliers', 'To increase dataset size'], correctAnswer: 'To bring features to a comparable scale', hints: ['Think about what happens when one feature ranges 0-1 and another 0-10000', 'Distance-based algorithms are especially sensitive to this', 'It\'s about fairness between features'], explanation: 'Normalization brings features to a comparable scale so no single feature dominates the learning algorithm due to its magnitude.' },
      { id: 'dp-2', question: 'Which normalization produces values with mean=0 and std=1?', difficulty: 2, type: 'multiple-choice', options: ['Min-Max scaling', 'Z-score standardization', 'Log transformation', 'Decimal scaling'], correctAnswer: 'Z-score standardization', hints: ['It uses the mean and standard deviation', 'The formula involves subtracting μ and dividing by σ'], explanation: 'Z-score standardization (z = (x-μ)/σ) centers data at zero mean with unit standard deviation.' },
      { id: 'dp-3', question: 'Put these preprocessing steps in the correct order:', difficulty: 3, type: 'ordering', correctAnswer: ['Handle missing values', 'Remove outliers', 'Normalize features', 'Split into train/test'], hints: ['You can\'t normalize data that has gaps', 'Outliers affect normalization statistics'], explanation: 'Missing values must be handled first, then outliers removed, then normalization applied (so stats aren\'t skewed by outliers), and finally the data is split.' },
    ],
    codeExample: `import numpy as np\nfrom sklearn.preprocessing import StandardScaler\n\nX = np.array([[1, 200], [2, 300], [3, 400]])\nscaler = StandardScaler()\nX_scaled = scaler.fit_transform(X)\nprint(X_scaled)  # zero mean, unit variance`,
    resources: [
      { title: 'Scikit-learn Preprocessing Guide', url: 'https://scikit-learn.org/stable/modules/preprocessing.html', type: 'tutorial' },
      { title: 'Data Cleaning with Python', url: 'https://realpython.com/python-data-cleaning-numpy-pandas/', type: 'tutorial' },
    ],
  },

  'linear-regression': {
    id: 'linear-regression',
    name: 'Linear Regression',
    description: 'Predicting continuous outcomes by fitting a linear relationship between features and target.',
    detailedDescription: 'Linear regression models the relationship between a dependent variable y and one or more independent variables X by fitting a linear equation y = Xw + b. The model learns weights w and bias b that minimize the sum of squared residuals between predicted and actual values. Despite its simplicity, linear regression remains one of the most interpretable and widely-used models, serving as the foundation for understanding more complex algorithms.',
    mathNotation: '\\hat{y} = \\mathbf{w}^T \\mathbf{x} + b \\quad \\text{minimize} \\sum_{i=1}^{n}(y_i - \\hat{y}_i)^2',
    tier: 1,
    bloomLevel: 'understand',
    prerequisites: ['data-preprocessing'],
    connections: ['gradient-descent', 'loss-functions', 'logistic-regression'],
    quizzes: [
      { id: 'lr-1', question: 'What does linear regression predict?', difficulty: 1, type: 'multiple-choice', options: ['Categories', 'Continuous values', 'Clusters', 'Rankings'], correctAnswer: 'Continuous values', hints: ['Think about the output type', 'The output is a number on a continuous scale'], explanation: 'Linear regression predicts continuous numerical values, unlike classification which predicts categories.' },
      { id: 'lr-2', question: 'What loss function does ordinary least squares minimize?', difficulty: 2, type: 'multiple-choice', options: ['Cross-entropy loss', 'Hinge loss', 'Mean squared error', 'Absolute error'], correctAnswer: 'Mean squared error', hints: ['It involves squaring the differences', 'The name contains "squared"'], explanation: 'OLS minimizes the sum of squared residuals (MSE), which penalizes larger errors more than smaller ones.' },
      { id: 'lr-3', question: 'The closed-form solution for linear regression weights is:', difficulty: 3, type: 'fill-blank', correctAnswer: '(X^T X)^{-1} X^T y', hints: ['It involves the transpose of X', 'It\'s called the normal equation'], explanation: 'The normal equation w = (XᵀX)⁻¹Xᵀy gives the optimal weights directly without iteration.' },
    ],
    resources: [
      { title: 'StatQuest: Linear Regression', url: 'https://www.youtube.com/watch?v=nk2CQITm_eo', type: 'video' },
      { title: 'Linear Regression — scikit-learn', url: 'https://scikit-learn.org/stable/modules/linear_model.html', type: 'tutorial' },
    ],
  },

  'gradient-descent': {
    id: 'gradient-descent',
    name: 'Gradient Descent',
    description: 'Iterative optimization algorithm that minimizes a loss function by following its gradient.',
    detailedDescription: 'Gradient descent is the workhorse optimization algorithm of machine learning. It iteratively adjusts model parameters in the direction of steepest descent of the loss function. The learning rate controls step size — too large causes divergence, too small causes slow convergence. Variants include batch GD (uses all data), stochastic GD (one sample), and mini-batch GD (subset). Momentum-based methods like Adam add velocity to navigate complex loss landscapes more efficiently.',
    mathNotation: '\\theta_{t+1} = \\theta_t - \\alpha \\nabla_{\\theta} J(\\theta)',
    tier: 1,
    bloomLevel: 'apply',
    prerequisites: ['linear-regression', 'loss-functions'],
    connections: ['optimization-algorithms', 'backpropagation'],
    explorationId: 'gradient-descent',
    quizzes: [
      { id: 'gd-1', question: 'What happens if the learning rate is too large?', difficulty: 1, type: 'multiple-choice', options: ['Training is slow but stable', 'The model converges faster', 'The optimization may diverge', 'The model underfits'], correctAnswer: 'The optimization may diverge', hints: ['Think about taking steps that are too big', 'You might overshoot the minimum'], explanation: 'A learning rate that is too large causes the parameters to overshoot the minimum, leading to divergence or oscillation.' },
      { id: 'gd-2', question: 'What does the gradient of the loss function tell us?', difficulty: 2, type: 'multiple-choice', options: ['The minimum loss value', 'The direction of steepest ascent', 'The optimal learning rate', 'The number of iterations needed'], correctAnswer: 'The direction of steepest ascent', hints: ['The gradient is a vector that points somewhere', 'We move in the negative gradient direction'], explanation: 'The gradient points in the direction of steepest ascent. We move in the negative gradient direction to descend toward the minimum.' },
      { id: 'gd-3', question: 'Which variant uses a single random sample per update?', difficulty: 2, type: 'multiple-choice', options: ['Batch gradient descent', 'Stochastic gradient descent', 'Mini-batch gradient descent', 'Newton\'s method'], correctAnswer: 'Stochastic gradient descent', hints: ['Stochastic means random'], explanation: 'SGD uses a single randomly selected sample per parameter update, making it noisy but fast.' },
    ],
    codeExample: `# Simple gradient descent\nw = 0.0  # initial weight\nalpha = 0.01  # learning rate\n\nfor step in range(100):\n    grad = compute_gradient(w, X, y)\n    w = w - alpha * grad`,
    resources: [
      { title: 'Gradient Descent Visualization', url: 'https://distill.pub/2017/momentum/', type: 'tutorial' },
      { title: '3Blue1Brown: Gradient Descent', url: 'https://www.youtube.com/watch?v=IHZwWFHWa-w', type: 'video' },
    ],
  },

  'loss-functions': {
    id: 'loss-functions',
    name: 'Loss Functions',
    description: 'Mathematical functions that measure how wrong a model\'s predictions are.',
    detailedDescription: 'Loss functions quantify the discrepancy between predicted and actual values, providing the signal that drives learning. Different tasks require different loss functions: MSE for regression, cross-entropy for classification, hinge loss for SVMs. The choice of loss function shapes the optimization landscape and affects what the model learns to prioritize. A good loss function should be differentiable (for gradient-based optimization) and aligned with the actual performance metric.',
    mathNotation: 'L_{MSE} = \\frac{1}{n}\\sum(y_i - \\hat{y}_i)^2 \\quad L_{CE} = -\\sum y_i \\log(\\hat{y}_i)',
    tier: 1,
    bloomLevel: 'understand',
    prerequisites: ['linear-regression'],
    connections: ['gradient-descent', 'backpropagation'],
    quizzes: [
      { id: 'lf-1', question: 'Which loss function is used for binary classification?', difficulty: 1, type: 'multiple-choice', options: ['MSE', 'Binary cross-entropy', 'MAE', 'Hinge loss'], correctAnswer: 'Binary cross-entropy', hints: ['It involves logarithms of probabilities', 'Cross-entropy measures divergence between distributions'], explanation: 'Binary cross-entropy (log loss) is the standard loss for binary classification, measuring divergence between predicted probabilities and true labels.' },
      { id: 'lf-2', question: 'Why is MSE preferred over MAE for regression?', difficulty: 2, type: 'multiple-choice', options: ['It\'s always more accurate', 'It penalizes large errors more heavily', 'It\'s faster to compute', 'It handles outliers better'], correctAnswer: 'It penalizes large errors more heavily', hints: ['Squaring amplifies larger values', 'MAE treats a 10-unit error as only 10x worse than a 1-unit error'], explanation: 'MSE squares errors, so a 10-unit error contributes 100 to the loss vs 10 for MAE. This makes MSE more sensitive to outliers and large errors.' },
    ],
    resources: [
      { title: 'Loss Functions Explained', url: 'https://ml-cheatsheet.readthedocs.io/en/latest/loss_functions.html', type: 'tutorial' },
    ],
  },

  'overfitting': {
    id: 'overfitting',
    name: 'Overfitting & Underfitting',
    description: 'When a model memorizes training data instead of learning generalizable patterns.',
    detailedDescription: 'Overfitting occurs when a model learns noise and idiosyncrasies of training data rather than the underlying pattern, leading to poor generalization. Underfitting occurs when a model is too simple to capture the underlying pattern. The bias-variance tradeoff governs this: high-bias models underfit, high-variance models overfit. Techniques to combat overfitting include regularization (L1/L2), dropout, early stopping, data augmentation, and cross-validation.',
    mathNotation: '\\text{Total Error} = \\text{Bias}^2 + \\text{Variance} + \\text{Irreducible Noise}',
    tier: 1,
    bloomLevel: 'analyze',
    prerequisites: ['linear-regression', 'loss-functions'],
    connections: ['bias-variance', 'regularization', 'evaluation-metrics'],
    quizzes: [
      { id: 'of-1', question: 'A model with high training accuracy but low test accuracy is:', difficulty: 1, type: 'multiple-choice', options: ['Underfitting', 'Overfitting', 'Well-generalized', 'Randomly guessing'], correctAnswer: 'Overfitting', hints: ['It performs well on data it has seen', 'But poorly on new data'], explanation: 'High training accuracy with low test accuracy indicates the model has memorized the training data (overfitting) rather than learning generalizable patterns.' },
      { id: 'of-2', question: 'Which technique helps prevent overfitting?', difficulty: 1, type: 'multiple-choice', options: ['Adding more features', 'Increasing model complexity', 'L2 regularization', 'Removing validation data'], correctAnswer: 'L2 regularization', hints: ['It adds a penalty for large weights', 'Also known as weight decay'], explanation: 'L2 regularization adds a penalty proportional to the squared magnitude of weights, discouraging complex models and reducing overfitting.' },
    ],
    resources: [
      { title: 'StatQuest: Bias-Variance Tradeoff', url: 'https://www.youtube.com/watch?v=EuBBz3bI-aA', type: 'video' },
    ],
  },

  'bias-variance': {
    id: 'bias-variance',
    name: 'Bias-Variance Tradeoff',
    description: 'The fundamental tension between model simplicity (bias) and sensitivity to data (variance).',
    detailedDescription: 'The bias-variance tradeoff is a central concept in statistical learning. Bias measures how far off predictions are on average (systematic error), while variance measures how much predictions fluctuate across different training sets. Simple models have high bias but low variance; complex models have low bias but high variance. The optimal model minimizes total error, which is the sum of bias², variance, and irreducible noise.',
    mathNotation: 'E[(y - \\hat{f}(x))^2] = \\text{Bias}[\\hat{f}(x)]^2 + \\text{Var}[\\hat{f}(x)] + \\sigma^2',
    tier: 1,
    bloomLevel: 'analyze',
    prerequisites: ['overfitting'],
    connections: ['ensemble-methods', 'regularization'],
    quizzes: [
      { id: 'bv-1', question: 'A decision tree with no depth limit tends to have:', difficulty: 1, type: 'multiple-choice', options: ['High bias, low variance', 'Low bias, high variance', 'High bias, high variance', 'Low bias, low variance'], correctAnswer: 'Low bias, high variance', hints: ['Deep trees can fit training data perfectly', 'But they\'re very sensitive to the specific data'], explanation: 'An unrestricted decision tree can perfectly fit training data (low bias) but small changes in data lead to very different trees (high variance).' },
      { id: 'bv-2', question: 'How does ensemble averaging (e.g., Random Forests) help?', difficulty: 2, type: 'multiple-choice', options: ['Reduces bias', 'Reduces variance', 'Reduces both equally', 'Increases bias to reduce variance'], correctAnswer: 'Reduces variance', hints: ['Averaging many predictions smooths out fluctuations', 'Each tree may overfit differently'], explanation: 'Ensemble averaging reduces variance by combining predictions from many models, smoothing out individual model fluctuations while maintaining low bias.' },
    ],
    resources: [
      { title: 'Understanding the Bias-Variance Tradeoff', url: 'http://scott.fortmann-roe.com/docs/BiasVariance.html', type: 'tutorial' },
    ],
  },

  'evaluation-metrics': {
    id: 'evaluation-metrics',
    name: 'Evaluation Metrics',
    description: 'Quantitative measures to assess model performance: accuracy, precision, recall, F1, AUC.',
    detailedDescription: 'Evaluation metrics quantify how well a model performs on unseen data. For classification: accuracy (overall correctness), precision (positive predictive value), recall (sensitivity), F1 (harmonic mean of precision and recall), and AUC-ROC (discrimination ability). For regression: MSE, RMSE, MAE, R². The choice of metric depends on the problem — e.g., in medical diagnosis, recall is critical to avoid missing positive cases.',
    mathNotation: 'F_1 = 2 \\cdot \\frac{\\text{Precision} \\cdot \\text{Recall}}{\\text{Precision} + \\text{Recall}}',
    tier: 1,
    bloomLevel: 'apply',
    prerequisites: ['overfitting'],
    connections: ['logistic-regression', 'decision-trees'],
    quizzes: [
      { id: 'em-1', question: 'When is accuracy a misleading metric?', difficulty: 2, type: 'multiple-choice', options: ['When classes are balanced', 'When classes are imbalanced', 'When using regression', 'When the model is simple'], correctAnswer: 'When classes are imbalanced', hints: ['Imagine 99% of data is one class', 'A model that always predicts the majority class gets 99% accuracy'], explanation: 'With imbalanced classes, a model predicting only the majority class achieves high accuracy while completely failing to identify the minority class.' },
      { id: 'em-2', question: 'Precision measures:', difficulty: 1, type: 'multiple-choice', options: ['True positives out of all actual positives', 'True positives out of all predicted positives', 'Overall correctness', 'Model confidence'], correctAnswer: 'True positives out of all predicted positives', hints: ['It\'s about the quality of positive predictions', 'TP / (TP + FP)'], explanation: 'Precision = TP/(TP+FP) measures what fraction of positive predictions were actually correct.' },
    ],
    resources: [
      { title: 'Scikit-learn Metrics Guide', url: 'https://scikit-learn.org/stable/modules/model_evaluation.html', type: 'tutorial' },
    ],
  },

  'feature-engineering': {
    id: 'feature-engineering',
    name: 'Feature Engineering',
    description: 'Creating and selecting informative features from raw data to improve model performance.',
    detailedDescription: 'Feature engineering is the art and science of transforming raw data into features that better represent the underlying problem, leading to improved model accuracy. Techniques include one-hot encoding for categorical variables, polynomial features for capturing non-linear relationships, interaction terms, binning, log transforms, and domain-specific feature creation. Feature selection methods (filter, wrapper, embedded) help identify the most informative features and reduce dimensionality.',
    mathNotation: '\\phi(x) = [x_1, x_2, x_1^2, x_2^2, x_1 x_2]',
    tier: 1,
    bloomLevel: 'apply',
    prerequisites: ['data-preprocessing'],
    connections: ['svm', 'linear-regression'],
    quizzes: [
      { id: 'fe-1', question: 'What is one-hot encoding used for?', difficulty: 1, type: 'multiple-choice', options: ['Normalizing numerical features', 'Converting categorical variables to binary vectors', 'Reducing dimensionality', 'Removing outliers'], correctAnswer: 'Converting categorical variables to binary vectors', hints: ['Think about representing colors as numbers', 'Each category gets its own binary column'], explanation: 'One-hot encoding creates a binary column for each category, allowing algorithms that require numerical input to handle categorical data.' },
      { id: 'fe-2', question: 'Why might polynomial features cause problems?', difficulty: 2, type: 'multiple-choice', options: ['They reduce model accuracy', 'They can lead to overfitting', 'They remove information', 'They only work with linear data'], correctAnswer: 'They can lead to overfitting', hints: ['More features means more model complexity', 'Think about the bias-variance tradeoff'], explanation: 'Polynomial features increase dimensionality and model complexity, which can lead to overfitting, especially with limited training data.' },
    ],
    resources: [
      { title: 'Feature Engineering for ML', url: 'https://developers.google.com/machine-learning/data-prep', type: 'tutorial' },
    ],
  },

  // =========================================================================
  // TIER 2 — Core ML
  // =========================================================================
  'logistic-regression': {
    id: 'logistic-regression',
    name: 'Logistic Regression',
    description: 'Classification algorithm that predicts probabilities using the sigmoid function.',
    detailedDescription: 'Despite its name, logistic regression is a classification algorithm. It applies the sigmoid function to a linear combination of features to produce probabilities between 0 and 1. The decision boundary is linear in feature space. Trained by maximizing log-likelihood (equivalent to minimizing cross-entropy loss). Extends to multi-class via softmax (multinomial logistic regression). Highly interpretable: coefficients indicate feature importance and direction.',
    mathNotation: 'P(y=1|x) = \\sigma(\\mathbf{w}^T\\mathbf{x} + b) = \\frac{1}{1 + e^{-(\\mathbf{w}^T\\mathbf{x} + b)}}',
    tier: 2,
    bloomLevel: 'understand',
    prerequisites: ['linear-regression', 'loss-functions', 'gradient-descent'],
    connections: ['neural-networks-intro', 'svm', 'evaluation-metrics'],
    quizzes: [
      { id: 'logr-1', question: 'What is the range of the sigmoid function output?', difficulty: 1, type: 'multiple-choice', options: ['(-∞, +∞)', '[-1, 1]', '(0, 1)', '[0, +∞)'], correctAnswer: '(0, 1)', hints: ['It maps to probabilities', 'Probabilities must be between 0 and 1'], explanation: 'The sigmoid function σ(z) = 1/(1+e^(-z)) maps any real number to the interval (0, 1), making it suitable for probability estimation.' },
      { id: 'logr-2', question: 'The decision boundary of logistic regression is:', difficulty: 2, type: 'multiple-choice', options: ['Always curved', 'Linear (a hyperplane)', 'Circular', 'Depends on the activation'], correctAnswer: 'Linear (a hyperplane)', hints: ['The sigmoid is applied after a linear combination', 'P=0.5 when wᵀx + b = 0'], explanation: 'The decision boundary is the set of points where P(y=1) = 0.5, which occurs when wᵀx + b = 0 — a linear hyperplane.' },
    ],
    resources: [
      { title: 'StatQuest: Logistic Regression', url: 'https://www.youtube.com/watch?v=yIYKR4sgzI8', type: 'video' },
    ],
  },

  'decision-trees': {
    id: 'decision-trees',
    name: 'Decision Trees',
    description: 'Tree-structured models that split data using feature thresholds to make predictions.',
    detailedDescription: 'Decision trees partition the feature space by recursively splitting on feature values that best separate the target classes (or reduce variance for regression). Split criteria include information gain (entropy reduction) and Gini impurity. Trees are highly interpretable but prone to overfitting. Pruning (pre or post) reduces complexity. The structure mirrors human decision-making, making them excellent for explaining predictions.',
    mathNotation: 'IG(S, A) = H(S) - \\sum_{v \\in \\text{Values}(A)} \\frac{|S_v|}{|S|} H(S_v)',
    tier: 2,
    bloomLevel: 'understand',
    prerequisites: ['evaluation-metrics', 'overfitting'],
    connections: ['random-forests', 'ensemble-methods'],
    quizzes: [
      { id: 'dt-1', question: 'What does Gini impurity measure?', difficulty: 1, type: 'multiple-choice', options: ['The depth of the tree', 'The probability of misclassification', 'The number of features used', 'Feature importance'], correctAnswer: 'The probability of misclassification', hints: ['It ranges from 0 (pure) to 0.5 (for binary)', 'A pure node has Gini = 0'], explanation: 'Gini impurity measures the probability that a randomly chosen sample would be misclassified if labeled according to the class distribution at that node.' },
      { id: 'dt-2', question: 'Why are decision trees prone to overfitting?', difficulty: 2, type: 'multiple-choice', options: ['They can\'t capture non-linear patterns', 'They can grow to perfectly fit every training point', 'They have too many hyperparameters', 'They require too much data'], correctAnswer: 'They can grow to perfectly fit every training point', hints: ['An unrestricted tree can have one leaf per data point', 'Think about variance'], explanation: 'Without constraints, a tree can create a leaf for every training sample, perfectly memorizing the data but failing to generalize.' },
    ],
    resources: [
      { title: 'Visual Decision Tree Guide', url: 'https://www.r2d3.us/visual-intro-to-machine-learning-part-1/', type: 'tutorial' },
    ],
  },

  'random-forests': {
    id: 'random-forests',
    name: 'Random Forests',
    description: 'Ensemble of decision trees trained on random subsets of data and features.',
    detailedDescription: 'Random forests combine multiple decision trees through bagging (bootstrap aggregating) and random feature selection. Each tree is trained on a random bootstrap sample of the data, and at each split, only a random subset of features is considered. Predictions are aggregated by majority vote (classification) or averaging (regression). This reduces variance compared to single trees while maintaining low bias, making random forests one of the most robust out-of-the-box algorithms.',
    mathNotation: '\\hat{y} = \\text{mode}(h_1(x), h_2(x), \\ldots, h_B(x)) \\quad \\text{where } h_b \\text{ are individual trees}',
    tier: 2,
    bloomLevel: 'understand',
    prerequisites: ['decision-trees', 'bias-variance'],
    connections: ['ensemble-methods'],
    quizzes: [
      { id: 'rf-1', question: 'How does random feature selection help Random Forests?', difficulty: 2, type: 'multiple-choice', options: ['It makes trees faster to train', 'It decorrelates the trees, reducing variance', 'It increases tree depth', 'It eliminates irrelevant features'], correctAnswer: 'It decorrelates the trees, reducing variance', hints: ['If all trees use the same strong feature, they\'ll be similar', 'Diversity among trees is key'], explanation: 'Random feature selection forces trees to use different features, making them less correlated. Averaging uncorrelated predictions reduces variance more effectively.' },
    ],
    resources: [
      { title: 'StatQuest: Random Forests', url: 'https://www.youtube.com/watch?v=J4Wdy0Wc_xQ', type: 'video' },
    ],
  },

  'svm': {
    id: 'svm',
    name: 'Support Vector Machines',
    description: 'Classifier that finds the maximum-margin hyperplane separating classes.',
    detailedDescription: 'SVMs find the hyperplane that maximizes the margin between classes. Points closest to the boundary (support vectors) define the decision boundary. The kernel trick maps data to higher-dimensional spaces where non-linear patterns become linearly separable, without explicitly computing the transformation. Common kernels include linear, polynomial, and RBF (Gaussian). SVMs are effective in high-dimensional spaces and with clear margin of separation.',
    mathNotation: '\\min_{w,b} \\frac{1}{2}||w||^2 \\quad \\text{s.t.} \\quad y_i(w^Tx_i + b) \\geq 1',
    tier: 2,
    bloomLevel: 'understand',
    prerequisites: ['logistic-regression', 'feature-engineering'],
    connections: ['neural-networks-intro'],
    explorationId: 'decision-boundary',
    quizzes: [
      { id: 'svm-1', question: 'What is the "margin" in SVM?', difficulty: 1, type: 'multiple-choice', options: ['The classification accuracy', 'The distance between the hyperplane and nearest points', 'The number of support vectors', 'The dimensionality of feature space'], correctAnswer: 'The distance between the hyperplane and nearest points', hints: ['Think about the gap between classes', 'The goal is to maximize this gap'], explanation: 'The margin is the perpendicular distance from the decision boundary to the nearest data points (support vectors) on either side.' },
      { id: 'svm-2', question: 'What does the kernel trick allow SVMs to do?', difficulty: 2, type: 'multiple-choice', options: ['Train faster on large datasets', 'Handle non-linearly separable data', 'Reduce the number of support vectors', 'Automatically select features'], correctAnswer: 'Handle non-linearly separable data', hints: ['It implicitly maps data to a higher dimension', 'In higher dimensions, data may become separable'], explanation: 'The kernel trick computes dot products in a higher-dimensional space without explicitly mapping data there, enabling non-linear decision boundaries.' },
    ],
    resources: [
      { title: 'SVM Visual Explanation', url: 'https://www.youtube.com/watch?v=efR1C6CvhmE', type: 'video' },
    ],
  },

  'ensemble-methods': {
    id: 'ensemble-methods',
    name: 'Ensemble Methods',
    description: 'Combining multiple models to achieve better performance than any individual model.',
    detailedDescription: 'Ensemble methods combine predictions from multiple models to improve accuracy and robustness. Key strategies include: Bagging (parallel independent models, reduces variance — e.g., Random Forests), Boosting (sequential models that correct previous errors, reduces bias — e.g., XGBoost, AdaBoost), and Stacking (meta-learner trained on base model predictions). The wisdom-of-crowds principle: diverse, independent models make better collective predictions.',
    mathNotation: '\\text{AdaBoost: } H(x) = \\text{sign}\\left(\\sum_{t=1}^{T} \\alpha_t h_t(x)\\right)',
    tier: 2,
    bloomLevel: 'understand',
    prerequisites: ['decision-trees', 'bias-variance'],
    connections: ['random-forests'],
    quizzes: [
      { id: 'en-1', question: 'Bagging primarily reduces:', difficulty: 1, type: 'multiple-choice', options: ['Bias', 'Variance', 'Both equally', 'Neither'], correctAnswer: 'Variance', hints: ['It averages multiple models', 'Averaging reduces fluctuations'], explanation: 'Bagging (Bootstrap Aggregating) trains models on random subsets and averages predictions, primarily reducing variance through diversification.' },
      { id: 'en-2', question: 'In boosting, each new model focuses on:', difficulty: 2, type: 'multiple-choice', options: ['A random subset of data', 'The easiest examples', 'Examples the previous models got wrong', 'A different feature set'], correctAnswer: 'Examples the previous models got wrong', hints: ['Boosting is sequential and corrective', 'Misclassified points get higher weights'], explanation: 'Boosting algorithms increase the weight of misclassified examples, forcing subsequent models to focus on the errors of previous ones.' },
    ],
    resources: [
      { title: 'Ensemble Learning Guide', url: 'https://scikit-learn.org/stable/modules/ensemble.html', type: 'tutorial' },
    ],
  },

  'neural-networks-intro': {
    id: 'neural-networks-intro',
    name: 'Neural Networks',
    description: 'Networks of interconnected artificial neurons that learn hierarchical representations.',
    detailedDescription: 'Artificial neural networks are composed of layers of interconnected neurons (perceptrons). Each neuron computes a weighted sum of inputs, adds a bias, and applies a non-linear activation function. Networks with multiple hidden layers can learn increasingly abstract representations of data. The universal approximation theorem guarantees that a sufficiently wide single-layer network can approximate any continuous function, though deeper networks are more parameter-efficient.',
    mathNotation: 'a^{(l)} = \\sigma(W^{(l)} a^{(l-1)} + b^{(l)})',
    tier: 2,
    bloomLevel: 'understand',
    prerequisites: ['logistic-regression', 'gradient-descent'],
    connections: ['backpropagation', 'activation-functions', 'cnns', 'rnns'],
    explorationId: 'neural-network',
    quizzes: [
      { id: 'nn-1', question: 'Why do neural networks need non-linear activation functions?', difficulty: 2, type: 'multiple-choice', options: ['To speed up training', 'Without them, the network can only learn linear functions', 'To prevent overfitting', 'To reduce the number of parameters'], correctAnswer: 'Without them, the network can only learn linear functions', hints: ['A composition of linear functions is still linear', 'f(g(x)) = f(Ax+b) = A\'x+b\' if both are linear'], explanation: 'Without non-linear activations, stacking linear layers is equivalent to a single linear layer. Non-linearities enable networks to approximate complex functions.' },
      { id: 'nn-2', question: 'What is a "hidden layer"?', difficulty: 1, type: 'multiple-choice', options: ['A layer with dropout', 'Any layer between input and output', 'A layer with frozen weights', 'The output layer in classification'], correctAnswer: 'Any layer between input and output', hints: ['Its values aren\'t directly observed', 'It\'s "hidden" from the outside'], explanation: 'Hidden layers are intermediate layers between the input and output. Their activations are internal representations not directly tied to inputs or predictions.' },
    ],
    resources: [
      { title: '3Blue1Brown: Neural Networks', url: 'https://www.youtube.com/watch?v=aircAruvnKk', type: 'video' },
      { title: 'Neural Networks and Deep Learning (free book)', url: 'http://neuralnetworksanddeeplearning.com/', type: 'tutorial' },
    ],
  },

  'backpropagation': {
    id: 'backpropagation',
    name: 'Backpropagation',
    description: 'Algorithm for computing gradients in neural networks using the chain rule.',
    detailedDescription: 'Backpropagation efficiently computes the gradient of the loss with respect to every weight in a neural network by applying the chain rule of calculus in reverse order. Starting from the output loss, gradients flow backward through each layer. For each weight, the gradient indicates how much a small change would affect the loss. Combined with gradient descent, backprop enables training of deep networks. Understanding backprop reveals phenomena like vanishing/exploding gradients.',
    mathNotation: '\\frac{\\partial L}{\\partial w^{(l)}} = \\frac{\\partial L}{\\partial a^{(L)}} \\cdot \\prod_{k=l+1}^{L} \\frac{\\partial a^{(k)}}{\\partial a^{(k-1)}} \\cdot \\frac{\\partial a^{(l)}}{\\partial w^{(l)}}',
    tier: 2,
    bloomLevel: 'apply',
    prerequisites: ['neural-networks-intro', 'gradient-descent'],
    connections: ['activation-functions', 'optimization-algorithms'],
    quizzes: [
      { id: 'bp-1', question: 'Backpropagation computes gradients using:', difficulty: 1, type: 'multiple-choice', options: ['Random perturbation', 'Numerical differentiation', 'The chain rule', 'Evolutionary strategies'], correctAnswer: 'The chain rule', hints: ['It decomposes derivatives of compositions', 'd/dx f(g(x)) = f\'(g(x)) · g\'(x)'], explanation: 'Backpropagation applies the chain rule of calculus to decompose the gradient computation through successive layers of the network.' },
      { id: 'bp-2', question: 'What causes vanishing gradients?', difficulty: 2, type: 'multiple-choice', options: ['Learning rate too high', 'Multiplying many small derivatives (e.g., sigmoid)', 'Too few training examples', 'Using MSE loss'], correctAnswer: 'Multiplying many small derivatives (e.g., sigmoid)', hints: ['Sigmoid derivative max is 0.25', 'In deep networks, you multiply many such values'], explanation: 'When activation function derivatives are small (<1), multiplying them across many layers causes gradients to shrink exponentially toward zero, preventing early layers from learning.' },
    ],
    resources: [
      { title: '3Blue1Brown: Backpropagation', url: 'https://www.youtube.com/watch?v=Ilg3gGewQ5U', type: 'video' },
    ],
  },

  'activation-functions': {
    id: 'activation-functions',
    name: 'Activation Functions',
    description: 'Non-linear functions applied at each neuron: ReLU, sigmoid, tanh, and more.',
    detailedDescription: 'Activation functions introduce non-linearity into neural networks. Sigmoid (0,1) was historically popular but causes vanishing gradients. Tanh (-1,1) is zero-centered but still suffers vanishing gradients. ReLU (max(0,x)) solved vanishing gradients but can "die" (permanently output 0). Leaky ReLU, ELU, and GELU address this. Modern transformers use GELU. The choice of activation affects training dynamics, convergence speed, and the types of functions the network can efficiently represent.',
    mathNotation: '\\text{ReLU}(x) = \\max(0, x) \\quad \\sigma(x) = \\frac{1}{1+e^{-x}} \\quad \\tanh(x) = \\frac{e^x - e^{-x}}{e^x + e^{-x}}',
    tier: 2,
    bloomLevel: 'understand',
    prerequisites: ['neural-networks-intro'],
    connections: ['backpropagation', 'cnns', 'rnns'],
    quizzes: [
      { id: 'af-1', question: 'Why is ReLU preferred over sigmoid in deep networks?', difficulty: 2, type: 'multiple-choice', options: ['ReLU is smoother', 'ReLU avoids vanishing gradients', 'ReLU is bounded', 'ReLU is differentiable everywhere'], correctAnswer: 'ReLU avoids vanishing gradients', hints: ['ReLU\'s derivative is 1 for positive inputs', 'Sigmoid\'s derivative is at most 0.25'], explanation: 'ReLU has a constant gradient of 1 for positive inputs, preventing the vanishing gradient problem that plagues sigmoid/tanh in deep networks.' },
    ],
    resources: [
      { title: 'Activation Functions Compared', url: 'https://mlfromscratch.com/activation-functions-explained/', type: 'tutorial' },
    ],
  },

  // =========================================================================
  // TIER 3 — Deep Learning
  // =========================================================================
  'cnns': {
    id: 'cnns',
    name: 'Convolutional Neural Networks',
    description: 'Networks using learned convolutional filters for spatial pattern recognition.',
    detailedDescription: 'CNNs exploit spatial structure in data (images, time series) by learning local filters (kernels) that detect features like edges, textures, and shapes. Key operations: convolution (sliding filters over input), pooling (downsampling to reduce dimensionality and add translation invariance), and stacking layers to build increasingly abstract feature hierarchies. Modern architectures (ResNet, EfficientNet) use skip connections and compound scaling.',
    mathNotation: '(f * g)(i,j) = \\sum_m \\sum_n f(m,n) \\cdot g(i-m, j-n)',
    tier: 3,
    bloomLevel: 'understand',
    prerequisites: ['neural-networks-intro', 'backpropagation'],
    connections: ['transfer-learning', 'batch-normalization'],
    quizzes: [
      { id: 'cnn-1', question: 'What does a convolutional filter detect?', difficulty: 1, type: 'multiple-choice', options: ['Global image statistics', 'Local spatial patterns (edges, textures)', 'Color histograms', 'Image size'], correctAnswer: 'Local spatial patterns (edges, textures)', hints: ['Filters are small (e.g., 3x3)', 'They slide across the image looking for patterns'], explanation: 'Convolutional filters are small learnable templates that detect local features like edges, corners, and textures through element-wise multiplication and summation.' },
      { id: 'cnn-2', question: 'What is the purpose of pooling layers?', difficulty: 2, type: 'multiple-choice', options: ['To add more features', 'To reduce spatial dimensions and add invariance', 'To normalize activations', 'To prevent overfitting'], correctAnswer: 'To reduce spatial dimensions and add invariance', hints: ['Max pooling takes the maximum value in a region', 'It makes the representation smaller'], explanation: 'Pooling reduces spatial dimensions (computational efficiency) and provides translation invariance — a feature detected anywhere in the pooling window produces the same output.' },
    ],
    resources: [
      { title: 'CNN Explainer', url: 'https://poloclub.github.io/cnn-explainer/', type: 'tool' },
      { title: 'CS231n: CNNs for Visual Recognition', url: 'https://cs231n.github.io/', type: 'tutorial' },
    ],
  },

  'rnns': {
    id: 'rnns',
    name: 'Recurrent Neural Networks',
    description: 'Networks with loops that process sequential data by maintaining hidden state.',
    detailedDescription: 'RNNs process sequences by maintaining a hidden state that gets updated at each time step, creating a form of memory. The same weights are applied at every step (weight sharing). This makes them suitable for variable-length sequences like text and time series. However, vanilla RNNs struggle with long-range dependencies due to vanishing gradients. LSTM and GRU architectures address this with gating mechanisms.',
    mathNotation: 'h_t = \\sigma(W_{hh} h_{t-1} + W_{xh} x_t + b_h)',
    tier: 3,
    bloomLevel: 'understand',
    prerequisites: ['neural-networks-intro', 'backpropagation'],
    connections: ['lstm', 'transformers'],
    quizzes: [
      { id: 'rnn-1', question: 'What is the main limitation of vanilla RNNs?', difficulty: 2, type: 'multiple-choice', options: ['They can only process fixed-length inputs', 'They struggle with long-range dependencies', 'They require too much data', 'They can\'t handle numerical data'], correctAnswer: 'They struggle with long-range dependencies', hints: ['Gradients flow through many time steps', 'Think about vanishing gradients over time'], explanation: 'Vanilla RNNs suffer from vanishing gradients over many time steps, making it difficult to learn dependencies between distant elements in a sequence.' },
    ],
    resources: [
      { title: 'Understanding LSTMs (Colah\'s blog)', url: 'https://colah.github.io/posts/2015-08-Understanding-LSTMs/', type: 'tutorial' },
    ],
  },

  'lstm': {
    id: 'lstm',
    name: 'LSTM Networks',
    description: 'Gated RNN variant that selectively remembers and forgets information over long sequences.',
    detailedDescription: 'Long Short-Term Memory networks solve the vanishing gradient problem in RNNs using three gates: forget gate (what to discard from cell state), input gate (what new information to store), and output gate (what to output). The cell state acts as a conveyor belt, carrying information across many time steps with minimal gradient degradation. LSTMs can learn to remember information for hundreds of time steps, enabling tasks like machine translation and speech recognition.',
    mathNotation: 'f_t = \\sigma(W_f [h_{t-1}, x_t] + b_f) \\quad \\text{(forget gate)}',
    tier: 3,
    bloomLevel: 'understand',
    prerequisites: ['rnns'],
    connections: ['transformers'],
    quizzes: [
      { id: 'lstm-1', question: 'What does the forget gate in LSTM do?', difficulty: 2, type: 'multiple-choice', options: ['Removes neurons from the network', 'Decides what information to discard from the cell state', 'Randomly drops connections', 'Prevents backpropagation'], correctAnswer: 'Decides what information to discard from the cell state', hints: ['It outputs values between 0 and 1', '0 = forget completely, 1 = keep everything'], explanation: 'The forget gate uses a sigmoid to produce values between 0-1 for each element of the cell state, determining how much of the previous information to retain.' },
    ],
    resources: [
      { title: 'Colah: Understanding LSTMs', url: 'https://colah.github.io/posts/2015-08-Understanding-LSTMs/', type: 'tutorial' },
    ],
  },

  'regularization': {
    id: 'regularization',
    name: 'Regularization Techniques',
    description: 'Methods to prevent overfitting: L1/L2 penalties, dropout, early stopping, data augmentation.',
    detailedDescription: 'Regularization constrains model complexity to prevent overfitting. L2 (weight decay) adds ||w||² penalty, shrinking weights toward zero. L1 adds ||w||₁ penalty, promoting sparsity (some weights become exactly zero). Dropout randomly deactivates neurons during training, creating an implicit ensemble. Early stopping halts training when validation loss starts increasing. Data augmentation artificially increases training set diversity. Batch normalization also has a regularizing effect.',
    mathNotation: 'L_{\\text{reg}} = L + \\lambda_1 ||w||_1 + \\lambda_2 ||w||_2^2',
    tier: 3,
    bloomLevel: 'apply',
    prerequisites: ['overfitting', 'neural-networks-intro'],
    connections: ['batch-normalization'],
    quizzes: [
      { id: 'reg-1', question: 'What effect does L1 regularization have on weights?', difficulty: 2, type: 'multiple-choice', options: ['Makes all weights small', 'Drives some weights to exactly zero', 'Increases all weights equally', 'Only affects bias terms'], correctAnswer: 'Drives some weights to exactly zero', hints: ['L1 uses absolute value penalty', 'Think about the gradient of |w| near zero'], explanation: 'L1 regularization produces sparse models by driving less important weights to exactly zero, effectively performing feature selection.' },
      { id: 'reg-2', question: 'Dropout works by:', difficulty: 1, type: 'multiple-choice', options: ['Removing layers', 'Randomly deactivating neurons during training', 'Reducing the learning rate', 'Pruning the network permanently'], correctAnswer: 'Randomly deactivating neurons during training', hints: ['It\'s only active during training, not inference', 'Each neuron has a probability p of being "dropped"'], explanation: 'During training, dropout randomly sets neuron activations to zero with probability p, preventing co-adaptation and creating a regularizing effect similar to ensemble averaging.' },
    ],
    resources: [
      { title: 'Dropout Paper (Srivastava et al.)', url: 'https://jmlr.org/papers/v15/srivastava14a.html', type: 'paper' },
    ],
  },

  'optimization-algorithms': {
    id: 'optimization-algorithms',
    name: 'Optimization Algorithms',
    description: 'Advanced optimizers: SGD with momentum, RMSProp, Adam, and learning rate schedules.',
    detailedDescription: 'Beyond vanilla SGD, modern optimizers adapt learning rates per-parameter. Momentum accumulates gradient history to accelerate convergence in consistent directions. RMSProp adapts per-parameter rates using running average of squared gradients. Adam combines momentum and RMSProp with bias correction, making it the default choice for most deep learning. Learning rate schedules (cosine annealing, warm restarts) further improve training dynamics.',
    mathNotation: '\\text{Adam: } m_t = \\beta_1 m_{t-1} + (1-\\beta_1)g_t \\quad v_t = \\beta_2 v_{t-1} + (1-\\beta_2)g_t^2',
    tier: 3,
    bloomLevel: 'apply',
    prerequisites: ['gradient-descent', 'backpropagation'],
    connections: ['batch-normalization'],
    quizzes: [
      { id: 'opt-1', question: 'Adam optimizer combines:', difficulty: 2, type: 'multiple-choice', options: ['L1 and L2 regularization', 'Momentum and RMSProp', 'Batch and layer normalization', 'SGD and Newton\'s method'], correctAnswer: 'Momentum and RMSProp', hints: ['It keeps both first and second moment estimates', 'First moment ≈ momentum, second moment ≈ RMSProp'], explanation: 'Adam (Adaptive Moment Estimation) maintains running averages of both gradients (momentum, first moment) and squared gradients (RMSProp, second moment) for adaptive per-parameter learning rates.' },
    ],
    resources: [
      { title: 'Ruder: Overview of Gradient Descent Optimizers', url: 'https://ruder.io/optimizing-gradient-descent/', type: 'tutorial' },
    ],
  },

  'batch-normalization': {
    id: 'batch-normalization',
    name: 'Batch Normalization',
    description: 'Normalizing layer inputs to stabilize and accelerate deep network training.',
    detailedDescription: 'Batch normalization normalizes the inputs to each layer by subtracting the batch mean and dividing by batch standard deviation, then applying learnable scale and shift parameters. This reduces internal covariate shift (the phenomenon where layer input distributions change during training), allowing higher learning rates and faster convergence. It also has a mild regularizing effect. Layer normalization and group normalization are alternatives that don\'t depend on batch size.',
    mathNotation: '\\hat{x}_i = \\frac{x_i - \\mu_B}{\\sqrt{\\sigma_B^2 + \\epsilon}} \\quad y_i = \\gamma \\hat{x}_i + \\beta',
    tier: 3,
    bloomLevel: 'understand',
    prerequisites: ['neural-networks-intro', 'optimization-algorithms'],
    connections: ['cnns', 'transfer-learning'],
    quizzes: [
      { id: 'bn-1', question: 'What problem does batch normalization primarily address?', difficulty: 2, type: 'multiple-choice', options: ['Overfitting', 'Internal covariate shift', 'Vanishing gradients only', 'Data imbalance'], correctAnswer: 'Internal covariate shift', hints: ['Layer input distributions change during training', 'Each layer has to adapt to shifting inputs'], explanation: 'Batch normalization addresses internal covariate shift — the change in layer input distributions during training — by normalizing inputs to each layer, stabilizing the learning process.' },
    ],
    resources: [
      { title: 'Batch Normalization Paper', url: 'https://arxiv.org/abs/1502.03167', type: 'paper' },
    ],
  },

  'transfer-learning': {
    id: 'transfer-learning',
    name: 'Transfer Learning',
    description: 'Reusing a model trained on one task as the starting point for a different task.',
    detailedDescription: 'Transfer learning leverages knowledge from a pre-trained model (usually trained on a large dataset) for a new, often smaller task. Common approach: freeze early layers (which learn general features like edges and textures) and fine-tune later layers for the specific task. This dramatically reduces data requirements and training time. Transfer learning is fundamental to modern NLP (BERT, GPT) and computer vision (ImageNet pre-training). It works because learned representations often transfer across related tasks.',
    tier: 3,
    bloomLevel: 'apply',
    prerequisites: ['cnns', 'regularization'],
    connections: ['transformers', 'llms'],
    quizzes: [
      { id: 'tl-1', question: 'Why are early layers of a CNN usually frozen during transfer learning?', difficulty: 2, type: 'multiple-choice', options: ['To save memory', 'They already capture useful general features', 'They\'re not needed for the new task', 'To prevent overfitting only'], correctAnswer: 'They already capture useful general features', hints: ['Early layers detect edges, textures — universal features', 'These generalize across tasks'], explanation: 'Early CNN layers learn general visual features (edges, textures, shapes) that are useful across tasks. Freezing them preserves this knowledge while fine-tuning task-specific later layers.' },
    ],
    resources: [
      { title: 'Transfer Learning Tutorial', url: 'https://cs231n.github.io/transfer-learning/', type: 'tutorial' },
    ],
  },

  'autoencoders': {
    id: 'autoencoders',
    name: 'Autoencoders',
    description: 'Networks that learn compressed representations by encoding and decoding data.',
    detailedDescription: 'Autoencoders consist of an encoder that compresses input to a lower-dimensional latent representation and a decoder that reconstructs the original input. The bottleneck forces the network to learn the most important features. Variants: Variational Autoencoders (VAE) learn a probabilistic latent space enabling generation, Denoising Autoencoders learn robust features by reconstructing from corrupted inputs, Sparse Autoencoders enforce sparsity in the latent space. Used for dimensionality reduction, anomaly detection, and generative modeling.',
    mathNotation: 'z = f_{\\text{enc}}(x) \\quad \\hat{x} = f_{\\text{dec}}(z) \\quad L = ||x - \\hat{x}||^2',
    tier: 3,
    bloomLevel: 'understand',
    prerequisites: ['neural-networks-intro', 'backpropagation'],
    connections: ['gans', 'diffusion-models'],
    quizzes: [
      { id: 'ae-1', question: 'What forces an autoencoder to learn meaningful representations?', difficulty: 2, type: 'multiple-choice', options: ['Supervised labels', 'The bottleneck (reduced dimensionality)', 'Dropout layers', 'Skip connections'], correctAnswer: 'The bottleneck (reduced dimensionality)', hints: ['The latent space is smaller than the input', 'It can\'t just copy the input through'], explanation: 'The bottleneck layer has fewer dimensions than the input, forcing the encoder to learn a compressed representation that captures the most important features for reconstruction.' },
    ],
    resources: [
      { title: 'Autoencoder Tutorial', url: 'https://www.jeremyjordan.me/autoencoders/', type: 'tutorial' },
    ],
  },

  // =========================================================================
  // TIER 4 — Advanced
  // =========================================================================
  'transformers': {
    id: 'transformers',
    name: 'Transformers',
    description: 'Attention-based architecture that processes entire sequences in parallel.',
    detailedDescription: 'The Transformer architecture (Vaswani et al., 2017) revolutionized sequence modeling by replacing recurrence with self-attention. Key innovations: multi-head self-attention (captures different relationship types), positional encoding (injects sequence order information), and layer normalization with residual connections. Transformers process all positions in parallel (unlike sequential RNNs), enabling efficient training on GPUs. They form the backbone of modern NLP (BERT, GPT) and are expanding into vision (ViT), audio, and multi-modal tasks.',
    mathNotation: '\\text{Attention}(Q,K,V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V',
    tier: 4,
    bloomLevel: 'analyze',
    prerequisites: ['rnns', 'activation-functions'],
    connections: ['attention-mechanism', 'llms', 'self-supervised-learning'],
    quizzes: [
      { id: 'tr-1', question: 'What advantage do Transformers have over RNNs?', difficulty: 1, type: 'multiple-choice', options: ['They use less memory', 'They process all positions in parallel', 'They have fewer parameters', 'They don\'t need training data'], correctAnswer: 'They process all positions in parallel', hints: ['RNNs must process one token at a time', 'Attention sees all tokens simultaneously'], explanation: 'Unlike RNNs which process tokens sequentially, Transformers compute attention over all positions simultaneously, enabling massive parallelization on GPUs.' },
      { id: 'tr-2', question: 'Why is the scaling factor √d_k used in attention?', difficulty: 3, type: 'multiple-choice', options: ['To normalize the output range', 'To prevent dot products from growing too large', 'To reduce computation', 'For numerical stability only'], correctAnswer: 'To prevent dot products from growing too large', hints: ['As d_k grows, dot products grow in magnitude', 'Large values push softmax into saturated regions'], explanation: 'Dot products grow with dimensionality d_k. Without scaling, large values push softmax into regions with tiny gradients, hindering learning. Dividing by √d_k keeps the variance stable.' },
    ],
    resources: [
      { title: 'Attention Is All You Need', url: 'https://arxiv.org/abs/1706.03762', type: 'paper' },
      { title: 'The Illustrated Transformer', url: 'https://jalammar.github.io/illustrated-transformer/', type: 'tutorial' },
    ],
  },

  'attention-mechanism': {
    id: 'attention-mechanism',
    name: 'Attention Mechanism',
    description: 'Mechanism that learns which parts of the input to focus on for each output.',
    detailedDescription: 'Attention mechanisms allow models to dynamically focus on relevant parts of the input when producing each output element. Self-attention computes Query, Key, and Value vectors from each input position. The attention score between positions is the scaled dot product of Q and K, normalized by softmax. This creates a weighted combination of V vectors. Multi-head attention runs several attention functions in parallel, each learning to attend to different relationship types (syntactic, semantic, positional).',
    mathNotation: 'a_{ij} = \\frac{\\exp(q_i^T k_j / \\sqrt{d_k})}{\\sum_l \\exp(q_i^T k_l / \\sqrt{d_k})}',
    tier: 4,
    bloomLevel: 'analyze',
    prerequisites: ['transformers'],
    connections: ['llms', 'self-supervised-learning'],
    explorationId: 'attention',
    quizzes: [
      { id: 'att-1', question: 'In self-attention, Q, K, and V are derived from:', difficulty: 2, type: 'multiple-choice', options: ['Different inputs', 'The same input via different weight matrices', 'Pre-trained embeddings only', 'Random initialization'], correctAnswer: 'The same input via different weight matrices', hints: ['It\'s SELF-attention — input attends to itself', 'Q = XW_Q, K = XW_K, V = XW_V'], explanation: 'In self-attention, Q, K, and V are all derived from the same input sequence by multiplying with different learned weight matrices, allowing the input to attend to itself.' },
      { id: 'att-2', question: 'Multi-head attention is beneficial because:', difficulty: 2, type: 'multiple-choice', options: ['It uses fewer parameters', 'Different heads can learn different types of relationships', 'It reduces computation time', 'It replaces layer normalization'], correctAnswer: 'Different heads can learn different types of relationships', hints: ['Each head has its own Q, K, V projections', 'One head might learn syntax, another semantics'], explanation: 'Multiple attention heads allow the model to jointly attend to information from different representation subspaces — e.g., one head may focus on syntactic relationships while another captures semantic similarities.' },
    ],
    resources: [
      { title: 'Attention Explained (Lilian Weng)', url: 'https://lilianweng.github.io/posts/2018-06-24-attention/', type: 'tutorial' },
    ],
  },

  'gans': {
    id: 'gans',
    name: 'Generative Adversarial Networks',
    description: 'Two-network system where a generator and discriminator compete to produce realistic data.',
    detailedDescription: 'GANs consist of a Generator (creates synthetic data) and a Discriminator (distinguishes real from fake). They play a minimax game: the generator tries to fool the discriminator, while the discriminator tries to detect fakes. At equilibrium, the generator produces data indistinguishable from real data. Training is notoriously difficult (mode collapse, training instability). Variants like WGAN, StyleGAN, and conditional GAN address these issues. GANs excel at image synthesis, style transfer, and data augmentation.',
    mathNotation: '\\min_G \\max_D \\; E_{x \\sim p_{data}}[\\log D(x)] + E_{z \\sim p_z}[\\log(1 - D(G(z)))]',
    tier: 4,
    bloomLevel: 'analyze',
    prerequisites: ['neural-networks-intro', 'backpropagation', 'regularization'],
    connections: ['diffusion-models', 'autoencoders'],
    quizzes: [
      { id: 'gan-1', question: 'What is the generator\'s goal in a GAN?', difficulty: 1, type: 'multiple-choice', options: ['Classify images correctly', 'Produce data that fools the discriminator', 'Compress data efficiently', 'Maximize the discriminator\'s accuracy'], correctAnswer: 'Produce data that fools the discriminator', hints: ['The generator wants the discriminator to say "real"', 'It learns to create increasingly realistic data'], explanation: 'The generator aims to produce synthetic data so realistic that the discriminator cannot distinguish it from real data — minimizing D\'s ability to tell them apart.' },
      { id: 'gan-2', question: 'What is "mode collapse" in GAN training?', difficulty: 3, type: 'multiple-choice', options: ['The discriminator becomes too strong', 'The generator produces limited variety of outputs', 'Training loss goes to zero', 'The model runs out of memory'], correctAnswer: 'The generator produces limited variety of outputs', hints: ['The generator finds one type of output that works', 'It stops exploring diverse outputs'], explanation: 'Mode collapse occurs when the generator learns to produce only a few types of outputs that fool the discriminator, failing to capture the full diversity of the data distribution.' },
    ],
    resources: [
      { title: 'GAN Lab', url: 'https://poloclub.github.io/ganlab/', type: 'tool' },
      { title: 'Original GAN Paper', url: 'https://arxiv.org/abs/1406.2661', type: 'paper' },
    ],
  },

  'self-supervised-learning': {
    id: 'self-supervised-learning',
    name: 'Self-Supervised Learning',
    description: 'Learning representations from unlabeled data by solving pretext tasks.',
    detailedDescription: 'Self-supervised learning creates supervision signals from the data itself, eliminating the need for manual labels. Pretext tasks include: masked language modeling (predict masked words — BERT), next token prediction (predict the next word — GPT), contrastive learning (learn similar/dissimilar pairs — SimCLR), and masked image modeling (predict missing patches — MAE). The learned representations transfer well to downstream tasks with fine-tuning. This paradigm has enabled training on internet-scale data.',
    tier: 4,
    bloomLevel: 'analyze',
    prerequisites: ['transformers', 'transfer-learning'],
    connections: ['llms', 'multimodal-ai'],
    quizzes: [
      { id: 'ssl-1', question: 'BERT\'s pre-training task is:', difficulty: 2, type: 'multiple-choice', options: ['Next sentence prediction only', 'Masked language modeling', 'Image classification', 'Reinforcement learning'], correctAnswer: 'Masked language modeling', hints: ['Some tokens are hidden and must be predicted', 'It\'s like a fill-in-the-blank exercise'], explanation: 'BERT is pre-trained with masked language modeling: randomly masking 15% of tokens and training the model to predict them from context, plus next sentence prediction.' },
    ],
    resources: [
      { title: 'Self-Supervised Learning (Lilian Weng)', url: 'https://lilianweng.github.io/posts/2019-11-10-self-supervised/', type: 'tutorial' },
    ],
  },

  'graph-neural-networks': {
    id: 'graph-neural-networks',
    name: 'Graph Neural Networks',
    description: 'Networks that operate on graph-structured data, learning from node relationships.',
    detailedDescription: 'GNNs generalize neural networks to graph-structured data where entities (nodes) are connected by relationships (edges). Through message passing, each node aggregates information from its neighbors to update its representation. GCN (Graph Convolutional Network), GAT (Graph Attention Network), and GraphSAGE are key architectures. Applications include social network analysis, molecular property prediction, recommendation systems, and knowledge graphs. GNNs can learn both node-level and graph-level representations.',
    mathNotation: 'h_v^{(k)} = \\sigma\\left(W^{(k)} \\sum_{u \\in N(v)} \\frac{h_u^{(k-1)}}{|N(v)|} + B^{(k)} h_v^{(k-1)}\\right)',
    tier: 4,
    bloomLevel: 'understand',
    prerequisites: ['neural-networks-intro', 'backpropagation'],
    connections: ['self-supervised-learning'],
    quizzes: [
      { id: 'gnn-1', question: 'How do GNNs learn node representations?', difficulty: 2, type: 'multiple-choice', options: ['By flattening the graph into a sequence', 'By aggregating information from neighboring nodes', 'By converting nodes to images', 'By removing edges'], correctAnswer: 'By aggregating information from neighboring nodes', hints: ['It\'s called "message passing"', 'Each node collects info from its neighbors'], explanation: 'GNNs use message passing: each node aggregates feature vectors from its neighbors, applies a learned transformation, and updates its own representation iteratively.' },
    ],
    resources: [
      { title: 'A Gentle Introduction to GNNs', url: 'https://distill.pub/2021/gnn-intro/', type: 'tutorial' },
    ],
  },

  'diffusion-models': {
    id: 'diffusion-models',
    name: 'Diffusion Models',
    description: 'Generative models that learn to denoise data by reversing a gradual corruption process.',
    detailedDescription: 'Diffusion models generate data by learning to reverse a gradual noising process. Forward process: progressively add Gaussian noise to data over T steps until it becomes pure noise. Reverse process: a neural network learns to denoise at each step, gradually reconstructing clean data from noise. Mathematically grounded in score matching and stochastic differential equations. Diffusion models (DALL-E 2, Stable Diffusion, Midjourney) now produce state-of-the-art image generation, surpassing GANs in quality and diversity.',
    mathNotation: 'q(x_t|x_{t-1}) = \\mathcal{N}(x_t; \\sqrt{1-\\beta_t}x_{t-1}, \\beta_t I)',
    tier: 4,
    bloomLevel: 'understand',
    prerequisites: ['autoencoders', 'gans'],
    connections: ['multimodal-ai'],
    quizzes: [
      { id: 'dm-1', question: 'Diffusion models generate images by:', difficulty: 2, type: 'multiple-choice', options: ['Adversarial training', 'Progressively denoising random noise', 'Decoding latent codes', 'Template matching'], correctAnswer: 'Progressively denoising random noise', hints: ['Start with pure noise', 'Gradually remove noise step by step'], explanation: 'Diffusion models start with random Gaussian noise and iteratively remove small amounts of noise at each step, gradually transforming noise into a coherent image.' },
    ],
    resources: [
      { title: 'What are Diffusion Models?', url: 'https://lilianweng.github.io/posts/2021-07-11-diffusion-models/', type: 'tutorial' },
    ],
  },

  // =========================================================================
  // TIER 5 — Frontiers
  // =========================================================================
  'reinforcement-learning': {
    id: 'reinforcement-learning',
    name: 'Reinforcement Learning',
    description: 'Learning optimal behavior through trial and error with reward signals.',
    detailedDescription: 'RL agents learn to make decisions by interacting with an environment and receiving reward signals. The agent learns a policy π(a|s) that maps states to actions to maximize cumulative reward. Key concepts: state, action, reward, policy, value function. Model-free methods (Q-learning, policy gradient) learn directly from experience. Model-based methods learn a model of the environment. The exploration-exploitation dilemma is central: explore new actions or exploit known good ones? Deep RL (DQN, A3C, PPO) combines RL with neural networks for complex environments.',
    mathNotation: 'Q(s,a) \\leftarrow Q(s,a) + \\alpha [r + \\gamma \\max_{a\'} Q(s\',a\') - Q(s,a)]',
    tier: 5,
    bloomLevel: 'apply',
    prerequisites: ['neural-networks-intro', 'optimization-algorithms'],
    connections: ['multi-agent-rl', 'rlhf'],
    explorationId: 'rl-gridworld',
    quizzes: [
      { id: 'rl-1', question: 'In Q-learning, what does Q(s,a) represent?', difficulty: 1, type: 'multiple-choice', options: ['The immediate reward', 'The expected cumulative reward for taking action a in state s', 'The transition probability', 'The policy function'], correctAnswer: 'The expected cumulative reward for taking action a in state s', hints: ['Q stands for "quality"', 'It considers future rewards too, not just immediate'], explanation: 'Q(s,a) represents the expected total discounted reward from taking action a in state s and following the optimal policy thereafter.' },
      { id: 'rl-2', question: 'What is the exploration-exploitation tradeoff?', difficulty: 2, type: 'multiple-choice', options: ['Speed vs accuracy', 'Trying new actions vs using known good ones', 'Online vs offline learning', 'Model-free vs model-based'], correctAnswer: 'Trying new actions vs using known good ones', hints: ['Epsilon-greedy is a strategy for this', 'You might miss a better restaurant if you always go to the same one'], explanation: 'The exploration-exploitation dilemma: exploring new actions may discover better strategies, but exploiting known good actions gives reliable reward. Balancing both is essential for optimal learning.' },
      { id: 'rl-3', question: 'What does the discount factor γ control?', difficulty: 2, type: 'multiple-choice', options: ['Learning speed', 'How much future rewards are valued relative to immediate', 'Exploration rate', 'Number of episodes'], correctAnswer: 'How much future rewards are valued relative to immediate', hints: ['γ close to 0 means short-sighted', 'γ close to 1 means far-sighted'], explanation: 'The discount factor γ ∈ [0,1) determines how much the agent values future rewards vs immediate ones. γ=0 makes the agent greedy; γ close to 1 makes it consider long-term consequences.' },
    ],
    codeExample: `# Q-Learning update\nQ[s][a] += alpha * (\n    reward + gamma * max(Q[s_next]) - Q[s][a]\n)`,
    resources: [
      { title: 'Sutton & Barto: RL textbook (free)', url: 'http://incompleteideas.net/book/the-book.html', type: 'tutorial' },
      { title: 'Spinning Up in Deep RL', url: 'https://spinningup.openai.com/', type: 'tutorial' },
    ],
  },

  'multi-agent-rl': {
    id: 'multi-agent-rl',
    name: 'Multi-Agent RL',
    description: 'Multiple agents learning simultaneously in shared or competitive environments.',
    detailedDescription: 'Multi-agent RL studies how multiple learning agents interact in shared environments. Agents may cooperate (team games), compete (zero-sum games), or mix both (general-sum games). Key challenges: non-stationarity (each agent\'s optimal policy depends on others\' changing policies), credit assignment (who contributed to team success?), and communication (should agents share information?). Emergent behaviors often arise from simple reward structures. Applications include autonomous driving, game AI (AlphaStar), and economic modeling.',
    tier: 5,
    bloomLevel: 'evaluate',
    prerequisites: ['reinforcement-learning'],
    connections: ['rlhf'],
    quizzes: [
      { id: 'marl-1', question: 'The main challenge of multi-agent RL vs single-agent RL is:', difficulty: 2, type: 'multiple-choice', options: ['More compute needed', 'The environment is non-stationary from each agent\'s perspective', 'Reward is always zero-sum', 'Agents can\'t use neural networks'], correctAnswer: 'The environment is non-stationary from each agent\'s perspective', hints: ['Other agents are also learning and changing', 'The "environment" includes other agents\' behavior'], explanation: 'Each agent experiences a non-stationary environment because other agents are simultaneously learning and changing their policies, violating the stationarity assumption of single-agent RL.' },
    ],
    resources: [
      { title: 'Multi-Agent RL Survey', url: 'https://arxiv.org/abs/1911.10635', type: 'paper' },
    ],
  },

  'rlhf': {
    id: 'rlhf',
    name: 'RLHF',
    description: 'Aligning language models with human preferences using reinforcement learning from human feedback.',
    detailedDescription: 'Reinforcement Learning from Human Feedback (RLHF) fine-tunes language models to align with human preferences. Process: (1) Collect human comparisons of model outputs, (2) Train a reward model to predict human preferences, (3) Use PPO to optimize the language model against the reward model while staying close to the base model (KL penalty). RLHF was key to making ChatGPT helpful, harmless, and honest. Challenges include reward hacking, distributional shift, and the difficulty of capturing nuanced human values.',
    tier: 5,
    bloomLevel: 'evaluate',
    prerequisites: ['reinforcement-learning', 'llms'],
    connections: ['constitutional-ai'],
    quizzes: [
      { id: 'rlhf-1', question: 'What is the reward model in RLHF trained on?', difficulty: 2, type: 'multiple-choice', options: ['Automated metrics like BLEU', 'Human comparisons of model outputs', 'Self-generated rewards', 'Pre-defined rules'], correctAnswer: 'Human comparisons of model outputs', hints: ['Humans compare pairs of responses', 'The reward model learns to predict which response humans prefer'], explanation: 'The reward model is trained on human preference data — pairs of model outputs where humans indicated which response is better — learning to predict human preferences.' },
    ],
    resources: [
      { title: 'InstructGPT Paper', url: 'https://arxiv.org/abs/2203.02155', type: 'paper' },
      { title: 'RLHF Explained (Hugging Face)', url: 'https://huggingface.co/blog/rlhf', type: 'tutorial' },
    ],
  },

  'llms': {
    id: 'llms',
    name: 'Large Language Models',
    description: 'Massive transformer models trained on internet-scale text, exhibiting emergent capabilities.',
    detailedDescription: 'Large Language Models (GPT, Claude, LLaMA, Gemini) are transformers with billions of parameters trained on trillions of tokens of text. They learn to predict the next token, but this simple objective leads to emergent capabilities: in-context learning, chain-of-thought reasoning, code generation, and more. Scaling laws suggest predictable performance improvements with more parameters, data, and compute. Key techniques: tokenization (BPE), positional encodings, KV caching for efficient inference. Fundamental research questions include mechanistic interpretability, hallucination reduction, and efficient fine-tuning (LoRA, QLoRA).',
    tier: 5,
    bloomLevel: 'evaluate',
    prerequisites: ['transformers', 'attention-mechanism', 'self-supervised-learning'],
    connections: ['rlhf', 'constitutional-ai', 'multimodal-ai'],
    quizzes: [
      { id: 'llm-1', question: 'GPT-style models are trained to:', difficulty: 1, type: 'multiple-choice', options: ['Classify documents', 'Predict the next token', 'Translate between languages', 'Summarize text'], correctAnswer: 'Predict the next token', hints: ['The training objective is autoregressive', 'Given previous tokens, predict what comes next'], explanation: 'GPT models are trained with a causal language modeling objective: predicting the next token given all previous tokens. This simple objective produces remarkably capable models at scale.' },
      { id: 'llm-2', question: 'What are "emergent capabilities" in LLMs?', difficulty: 2, type: 'multiple-choice', options: ['Capabilities programmed by developers', 'Abilities that appear only at large scale, not present in smaller models', 'Features added through fine-tuning', 'Bugs in the training process'], correctAnswer: 'Abilities that appear only at large scale, not present in smaller models', hints: ['Small models can\'t do them, large models suddenly can', 'Examples: chain-of-thought reasoning, in-context learning'], explanation: 'Emergent capabilities are abilities that appear unpredictably as models scale up — they\'re absent in smaller models but suddenly manifest in larger ones, like few-shot learning and reasoning.' },
    ],
    resources: [
      { title: 'GPT-3 Paper', url: 'https://arxiv.org/abs/2005.14165', type: 'paper' },
      { title: 'State of GPT (Andrej Karpathy)', url: 'https://www.youtube.com/watch?v=bZQun8Y4L2A', type: 'video' },
    ],
  },

  'constitutional-ai': {
    id: 'constitutional-ai',
    name: 'Constitutional AI',
    description: 'Self-improvement framework where AI critiques and revises its own outputs using principles.',
    detailedDescription: 'Constitutional AI (CAI) is Anthropic\'s approach to AI alignment that reduces reliance on human feedback. The model is given a set of principles (a "constitution") and asked to: (1) generate a response, (2) critique it against the principles, (3) revise the response. This self-improvement loop generates training data without human labeling. Combined with RLHF from AI feedback (RLAIF), it produces models that are helpful, harmless, and honest. CAI addresses scalability limitations of pure RLHF.',
    tier: 5,
    bloomLevel: 'evaluate',
    prerequisites: ['rlhf', 'llms'],
    connections: ['multimodal-ai'],
    quizzes: [
      { id: 'cai-1', question: 'How does Constitutional AI differ from standard RLHF?', difficulty: 2, type: 'multiple-choice', options: ['It doesn\'t use neural networks', 'It uses AI self-critique instead of human feedback for some training', 'It only works with small models', 'It removes the reward model entirely'], correctAnswer: 'It uses AI self-critique instead of human feedback for some training', hints: ['The AI evaluates its own outputs', 'This reduces the need for human labelers'], explanation: 'Constitutional AI uses the model\'s own ability to critique and revise responses according to a set of principles, reducing dependence on expensive human preference data while maintaining alignment.' },
    ],
    resources: [
      { title: 'Constitutional AI Paper', url: 'https://arxiv.org/abs/2212.08073', type: 'paper' },
    ],
  },

  'multimodal-ai': {
    id: 'multimodal-ai',
    name: 'Multimodal AI',
    description: 'Systems that understand and generate across multiple data types: text, images, audio, video.',
    detailedDescription: 'Multimodal AI systems process and generate multiple types of data — text, images, audio, video, and more. Key approaches: contrastive learning (CLIP aligns text and image embeddings), cross-modal attention (Flamingo processes interleaved image-text), and unified architectures (Gemini processes any modality natively). Challenges include modality alignment (mapping different types of data to a shared representation space), efficient fusion, and maintaining performance across all modalities. Applications: image captioning, visual QA, text-to-image generation, video understanding.',
    tier: 5,
    bloomLevel: 'evaluate',
    prerequisites: ['transformers', 'self-supervised-learning'],
    connections: ['llms', 'constitutional-ai'],
    quizzes: [
      { id: 'mm-1', question: 'CLIP learns by:', difficulty: 2, type: 'multiple-choice', options: ['Classifying images into categories', 'Aligning text and image embeddings via contrastive learning', 'Generating images from text', 'Captioning images with RNNs'], correctAnswer: 'Aligning text and image embeddings via contrastive learning', hints: ['It learns to match images with their text descriptions', 'Correct pairs should have similar embeddings'], explanation: 'CLIP learns by training text and image encoders to produce similar embeddings for matching pairs and dissimilar embeddings for non-matching pairs, using contrastive loss.' },
    ],
    resources: [
      { title: 'CLIP Paper', url: 'https://arxiv.org/abs/2103.00020', type: 'paper' },
      { title: 'Multimodal Learning Survey', url: 'https://arxiv.org/abs/2209.03430', type: 'paper' },
    ],
  },
  // =========================================================================
  // TIER 5 (continued) — Cutting-Edge Methods (2024-2026)
  // =========================================================================

  'mixture-of-experts': {
    id: 'mixture-of-experts',
    name: 'Mixture of Experts (MoE)',
    description: 'Architecture that routes inputs to specialized sub-networks, enabling trillion-parameter models at manageable cost.',
    detailedDescription: 'Mixture of Experts (MoE) divides a model into multiple "expert" sub-networks with a learned routing mechanism. For each input token, a gating network selects only 1-2 experts to activate, so the model can have enormous total parameters while only using a fraction per inference step. GPT-5, DeepSeek V3, Mixtral, and most 2025-2026 frontier models use MoE. Key innovations include load-balanced routing (preventing expert collapse), fine-grained experts (more smaller experts), and shared experts (always active for common patterns).',
    mathNotation: 'y = \\sum_{i=1}^{N} G(x)_i \\cdot E_i(x) \\quad \\text{where } G(x) \\text{ is a sparse gating function}',
    tier: 5,
    bloomLevel: 'analyze',
    prerequisites: ['transformers', 'llms'],
    connections: ['multimodal-ai', 'constitutional-ai'],
    quizzes: [
      { id: 'moe-1', question: 'What is the main advantage of Mixture of Experts?', difficulty: 1, type: 'multiple-choice', options: ['Faster training from scratch', 'Huge parameter count with low per-token compute cost', 'Eliminates the need for GPUs', 'Better at small-scale tasks'], correctAnswer: 'Huge parameter count with low per-token compute cost', hints: ['Think about what "sparse activation" means', 'Only some experts run per token'], explanation: 'MoE enables models with trillions of parameters while only activating a small subset per token, keeping inference costs manageable.' },
      { id: 'moe-2', question: 'What prevents "expert collapse" in MoE models?', difficulty: 2, type: 'multiple-choice', options: ['Dropout regularization', 'Load balancing loss that distributes tokens evenly', 'Using fewer experts', 'Training each expert separately'], correctAnswer: 'Load balancing loss that distributes tokens evenly', hints: ['Without it, the router might always pick the same expert', 'An auxiliary loss term encourages balanced routing'], explanation: 'A load balancing auxiliary loss ensures the gating network distributes tokens roughly evenly across experts, preventing degenerate solutions where most experts go unused.' },
    ],
    resources: [
      { title: 'Switch Transformers Paper', url: 'https://arxiv.org/abs/2101.03961', type: 'paper' },
      { title: 'Mixtral Technical Report', url: 'https://arxiv.org/abs/2401.04088', type: 'paper' },
    ],
  },

  'state-space-models': {
    id: 'state-space-models',
    name: 'State Space Models (Mamba)',
    description: 'Linear-time sequence models that offer an alternative to quadratic attention in Transformers.',
    detailedDescription: 'State Space Models (SSMs) like Mamba process sequences in linear time O(n) compared to O(n²) for standard attention. They maintain a hidden state that is selectively updated as each token is processed, similar to RNNs but with crucial innovations: selective state spaces let the model dynamically adjust how much information to retain or forget for each input. Mamba combines this with efficient hardware-aware implementation. Hybrid architectures (Mamba layers + attention layers) are used in NVIDIA Nemotron, Qwen3-Next, and Kimi Linear, offering the best of both worlds.',
    tier: 5,
    bloomLevel: 'analyze',
    prerequisites: ['transformers', 'attention-mechanism'],
    connections: ['llms', 'mixture-of-experts'],
    quizzes: [
      { id: 'ssm-1', question: 'What is the time complexity of Mamba for sequence length n?', difficulty: 1, type: 'multiple-choice', options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(1)'], correctAnswer: 'O(n)', hints: ['Unlike attention, it doesn\'t compare every token to every other', 'It processes tokens one at a time with a recurrent-like mechanism'], explanation: 'Mamba processes sequences in linear O(n) time by maintaining a compressed hidden state, unlike attention which is O(n²) in sequence length.' },
      { id: 'ssm-2', question: 'What makes Mamba\'s state space "selective"?', difficulty: 2, type: 'multiple-choice', options: ['It only processes important tokens', 'Its parameters change dynamically based on the input', 'It uses attention within the state', 'It skips certain layers'], correctAnswer: 'Its parameters change dynamically based on the input', hints: ['The key innovation is input-dependent parameters', 'Unlike traditional SSMs with fixed dynamics'], explanation: 'Selective state spaces make the SSM parameters (like the discretization step and state matrix) depend on the input, allowing the model to dynamically decide what to remember and what to forget.' },
    ],
    resources: [
      { title: 'Mamba Paper', url: 'https://arxiv.org/abs/2312.00752', type: 'paper' },
      { title: 'Annotated Mamba', url: 'https://srush.github.io/annotated-mamba/', type: 'tutorial' },
    ],
  },

  'retrieval-augmented-generation': {
    id: 'retrieval-augmented-generation',
    name: 'Retrieval-Augmented Generation (RAG)',
    description: 'Combining LLMs with external knowledge retrieval to ground responses in factual data.',
    detailedDescription: 'RAG enhances LLM outputs by first retrieving relevant documents from an external knowledge base, then conditioning the generation on those documents. The pipeline: (1) user query → (2) embed query with same model used to embed documents → (3) vector similarity search in a database → (4) top-k relevant chunks retrieved → (5) chunks + query fed to LLM as context → (6) grounded response. Benefits: reduced hallucination, updatable knowledge without retraining, attribution to sources. Advanced RAG includes query rewriting, hypothetical document embeddings (HyDE), and recursive retrieval.',
    tier: 5,
    bloomLevel: 'apply',
    prerequisites: ['llms', 'transformers'],
    connections: ['multimodal-ai'],
    quizzes: [
      { id: 'rag-1', question: 'What is the main purpose of RAG?', difficulty: 1, type: 'multiple-choice', options: ['To train models faster', 'To ground LLM responses in external factual data', 'To reduce model size', 'To generate training data'], correctAnswer: 'To ground LLM responses in external factual data', hints: ['Think about why LLMs hallucinate', 'RAG gives the model access to a knowledge base'], explanation: 'RAG retrieves relevant documents from an external source and provides them as context, helping the LLM generate responses grounded in factual, up-to-date information rather than relying solely on its training data.' },
      { id: 'rag-2', question: 'Put these RAG pipeline steps in order:', difficulty: 3, type: 'ordering', correctAnswer: ['Embed the user query', 'Search vector database for similar chunks', 'Retrieve top-k relevant documents', 'Feed documents + query to LLM', 'Generate grounded response'], hints: ['The query needs to be in the same space as the documents', 'Search happens before generation'], explanation: 'The RAG pipeline: embed query → vector search → retrieve docs → feed to LLM → generate response. Each step builds on the previous one.' },
    ],
    resources: [
      { title: 'RAG Paper (Lewis et al.)', url: 'https://arxiv.org/abs/2005.11401', type: 'paper' },
      { title: 'LlamaIndex RAG Tutorial', url: 'https://docs.llamaindex.ai/en/stable/', type: 'tutorial' },
    ],
  },

  'direct-preference-optimization': {
    id: 'direct-preference-optimization',
    name: 'Direct Preference Optimization (DPO)',
    description: 'Simplified alignment technique that trains on preference pairs without a separate reward model.',
    detailedDescription: 'DPO is an alternative to RLHF that simplifies the alignment pipeline. Instead of training a reward model and then using reinforcement learning, DPO directly optimizes the language model on human preference pairs (chosen vs rejected responses). The key insight: the optimal RLHF policy has a closed-form solution relative to the reward model, so you can reparametrize the reward in terms of the policy itself and optimize directly. This eliminates the reward model, the RL optimizer, and the sampling loop, making training more stable and much simpler to implement.',
    mathNotation: '\\mathcal{L}_{DPO} = -\\mathbb{E}\\left[\\log \\sigma\\left(\\beta \\log \\frac{\\pi_\\theta(y_w|x)}{\\pi_{ref}(y_w|x)} - \\beta \\log \\frac{\\pi_\\theta(y_l|x)}{\\pi_{ref}(y_l|x)}\\right)\\right]',
    tier: 5,
    bloomLevel: 'analyze',
    prerequisites: ['rlhf', 'llms'],
    connections: ['constitutional-ai'],
    quizzes: [
      { id: 'dpo-1', question: 'What does DPO eliminate compared to standard RLHF?', difficulty: 2, type: 'multiple-choice', options: ['The need for human preferences', 'The separate reward model and RL training loop', 'The base language model', 'All fine-tuning'], correctAnswer: 'The separate reward model and RL training loop', hints: ['DPO is "direct" — it skips an intermediate step', 'No PPO needed'], explanation: 'DPO eliminates the need for a separate reward model and the RL optimization step (PPO). It directly optimizes the policy on preference data, making alignment simpler and more stable.' },
    ],
    resources: [
      { title: 'DPO Paper (Rafailov et al.)', url: 'https://arxiv.org/abs/2305.18290', type: 'paper' },
    ],
  },

  'agentic-ai': {
    id: 'agentic-ai',
    name: 'Agentic AI',
    description: 'AI systems that autonomously plan, use tools, execute code, and complete multi-step tasks.',
    detailedDescription: 'Agentic AI extends LLMs beyond single-turn Q&A into autonomous, multi-step problem solving. An agent has: (1) an LLM "brain" for reasoning and planning, (2) access to tools (code execution, web search, APIs, file I/O), (3) a memory system (conversation history + long-term storage), and (4) a planning loop (observe → think → act → reflect). Key challenges: reliable multi-step execution, error recovery, tool selection, and safety guardrails. Examples: Claude Code, OpenClaw, AutoGPT, Devin. 2025-2026 has been called the "Year of Agents" — every major AI lab now ships agent-capable products.',
    tier: 5,
    bloomLevel: 'evaluate',
    prerequisites: ['llms', 'reinforcement-learning'],
    connections: ['constitutional-ai', 'multimodal-ai'],
    quizzes: [
      { id: 'agent-1', question: 'What are the core components of an AI agent?', difficulty: 1, type: 'multiple-choice', options: ['Only an LLM', 'LLM + tools + memory + planning loop', 'A database and a UI', 'Multiple specialized neural networks'], correctAnswer: 'LLM + tools + memory + planning loop', hints: ['An agent needs to think, act, and remember', 'Tools let it interact with the world'], explanation: 'An AI agent combines an LLM for reasoning, tools for taking actions (code, search, APIs), memory for context, and a planning loop to break tasks into steps.' },
      { id: 'agent-2', question: 'Which is the biggest challenge for agentic AI?', difficulty: 2, type: 'multiple-choice', options: ['Token speed', 'Reliable multi-step execution without compounding errors', 'Cost of training', 'Image generation quality'], correctAnswer: 'Reliable multi-step execution without compounding errors', hints: ['Each step can introduce errors', 'A 95% per-step accuracy means ~60% over 10 steps'], explanation: 'Compounding errors across many steps is the core challenge. Even small per-step failure rates multiply over long task sequences, making reliability the key bottleneck.' },
    ],
    resources: [
      { title: 'LangChain Agents Documentation', url: 'https://python.langchain.com/docs/modules/agents/', type: 'tutorial' },
      { title: 'Anthropic Agent Design Guide', url: 'https://docs.anthropic.com/en/docs/agents', type: 'tutorial' },
    ],
  },
};

/** Get all concept IDs */
export const getAllConceptIds = (): string[] => Object.keys(curriculum);

/** Get concepts by tier */
export const getConceptsByTier = (tier: number): ConceptNode[] =>
  Object.values(curriculum).filter(c => c.tier === tier);

/** Get a single concept */
export const getConcept = (id: string): ConceptNode | undefined => curriculum[id];

/** Get all concepts that list the given ID as a prerequisite */
export const getDependents = (id: string): ConceptNode[] =>
  Object.values(curriculum).filter(c => c.prerequisites.includes(id));

/** Check if all prerequisites for a concept are mastered */
export const arePrerequisitesMet = (
  conceptId: string,
  masteryStates: Record<string, { masteryProbability: number }>
): boolean => {
  const concept = curriculum[conceptId];
  if (!concept) return false;
  return concept.prerequisites.every(preId => {
    const state = masteryStates[preId];
    return state && state.masteryProbability >= 0.85;
  });
};
