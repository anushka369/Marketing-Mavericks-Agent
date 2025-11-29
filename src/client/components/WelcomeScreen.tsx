interface WelcomeScreenProps {
  onExampleClick: (prompt: string) => void;
}

export default function WelcomeScreen({ onExampleClick }: WelcomeScreenProps) {
  const examplePrompts = [
    "Write a blog post about sustainable fashion for millennials",
    "Create social media posts for a new coffee shop opening",
    "Generate email marketing copy for a summer sale",
    "Develop a campaign strategy for launching a fitness app"
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        Marketing Mavericks Agent
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl">
        Your AI-powered marketing assistant for content generation and campaign planning
      </p>
      
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">I can help you with:</h2>
        <ul className="text-left text-gray-600 space-y-2">
          <li>✨ Blog posts and articles</li>
          <li>📱 Social media content</li>
          <li>📧 Email marketing campaigns</li>
          <li>🎯 Ad copy and variations</li>
          <li>📊 Campaign strategies</li>
        </ul>
      </div>

      <div className="w-full max-w-2xl">
        <h3 className="text-md font-semibold text-gray-700 mb-3">Try these examples:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {examplePrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => onExampleClick(prompt)}
              className="p-3 text-left text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-400 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
