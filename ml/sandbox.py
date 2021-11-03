from transformers import AutoTokenizer, AutoModelForSequenceClassification, AutoModelWithLMHead, AutoConfig, HfArgumentParser

print('loading')
model = AutoModelWithLMHead.from_pretrained("./pytorch_model.bin")
