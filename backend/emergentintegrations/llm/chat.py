class UserMessage:
    def __init__(self, text="", image_url=None):
        self.text = text
        self.image_url = image_url

class ImageContent:
    def __init__(self, url=""):
        self.url = url

class LlmChat:
    def __init__(self):
        pass

    async def process_message(self, message):
        # Mock implementation
        return "This is a mock response from the LLM"