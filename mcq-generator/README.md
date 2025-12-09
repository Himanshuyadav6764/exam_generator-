# MCQ Generator

## Overview
The MCQ Generator project is designed to automate the creation of multiple-choice questions (MCQs) based on specified topics. It leverages AI models to generate high-quality questions and includes validation mechanisms to ensure the generated content meets predefined criteria.

## Project Structure
The project is organized into several directories, each serving a specific purpose:

- **src**: Contains the main application code.
  - **agents**: Houses the agents responsible for generating and validating questions.
  - **services**: Contains business logic for managing MCQs and interacting with AI models.
  - **models**: Defines the data structures for MCQs and topics.
  - **utils**: Provides utility functions and prompt templates.
  - **config**: Contains configuration settings for the AI model.
  - **types**: Includes TypeScript types and interfaces for type safety.

- **tests**: Contains unit and integration tests to ensure the functionality of the application.
  - **unit**: Unit tests for individual components.
  - **integration**: Tests that verify the end-to-end functionality of the MCQ generation process.

- **data**: Holds JSON files for topics and sample MCQs used for testing and validation.

- **.env.example**: An example file for environment variables required by the application.

- **package.json**: Configuration file for npm, listing dependencies and scripts.

- **tsconfig.json**: TypeScript configuration file.

## Setup Instructions
1. Clone the repository:
   ```
   git clone <repository-url>
   cd mcq-generator
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env` and fill in the required values.

4. Run the application:
   ```
   npm start
   ```

## Usage
- The application can be used to generate MCQs by providing topics through the API.
- The generated questions can be validated using the Question Validator Agent.

## Contribution Guidelines
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them.
4. Push your branch and create a pull request.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.