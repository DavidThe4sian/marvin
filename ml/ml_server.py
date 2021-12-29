# import flask related modules
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS

# basic imports
import json
import sys
import os

# Pytorch imports
import torch
from torchtext.data.utils import get_tokenizer
from transformers import AutoTokenizer, AutoModelForSequenceClassification, AutoModelWithLMHead, AutoConfig, HfArgumentParser

# Joint Model imports
from jointclassifier.joint_args import ModelArguments, DataTrainingArguments, TrainingArguments
from jointclassifier.joint_dataloader import load_dataset
from jointclassifier.joint_trainer import JointTrainer
from jointclassifier.single_trainer import SingleTrainer
from jointclassifier.joint_model_v1 import JointSeqClassifier

#Utils and constants
from constants import MODEL_PATHS
from utils import get_buckets, bucket_match, sort_results, filter_results

import openai
import argparse

from transformers import T5Tokenizer, T5ForConditionalGeneration

import Levenshtein as lev
import difflib as dl;


app = Flask(__name__)
CORS(app)


def sandbox_init():
    global formality_emo, tokenizer, politeness_emo
    tokenizer = AutoTokenizer.from_pretrained("t5-small", model_max_length=64)
    formality_emo = AutoModelWithLMHead.from_pretrained("./t5_transfer_formality_joint_2/")
    politeness_emo = AutoModelWithLMHead.from_pretrained("./t5_transfer_politeness_emo/")
    # tokenizer = T5Tokenizer.from_pretrained("t5-small")
    # return model

def load_models(modes):
    global classifier_tokenizer, classifier_trainers, classifier_models, transfer_models, transfer_tokenizer
    classifier_models= {}
    classifier_trainers = {}
    transfer_models = {}
    transfer_tokenizer = AutoTokenizer.from_pretrained(MODEL_PATHS['common']['transfer_name'], model_max_length=64, cache_dir="./models/cache")
    classifier_tokenizer = AutoTokenizer.from_pretrained(MODEL_PATHS['common']['classifier_name'], model_max_length=64, cache_dir="./models/cache")
    for mode in modes:
        if mode in ['micro-formality','macro-shakespeare']:
            mode_paths = MODEL_PATHS[mode]
            model_args = ModelArguments(
                model_name_or_path=mode_paths['classifier_name'],
                model_nick=mode_paths['classifier_nick'],
                cache_dir="./models/cache"
            )

            data_args = DataTrainingArguments(
                max_seq_len=64,
                task=mode_paths['classifier_task']
            )

            training_args = TrainingArguments(
                output_dir = mode_paths['classifier'],
                train_jointly= True
            )
            idx_to_classes = mode_paths['idx_to_classes']

            label_dims = mode_paths['label_dims']

            classifier_models[mode] = JointSeqClassifier.from_pretrained(
                training_args.output_dir,
                tasks=data_args.task.split('+'),
                model_args=model_args,
                task_if_single=None,
                joint = training_args.train_jointly,
                label_dims=label_dims
            )
            classifier_trainers[mode] = JointTrainer(
                [training_args,model_args, data_args],
                classifier_models[mode], idx_to_classes = idx_to_classes
            )


            transfer_models[mode] = AutoModelWithLMHead.from_pretrained(mode_paths['transfer'])
        elif mode in ['macro-binary']:
            mode_paths = MODEL_PATHS[mode]

            transfer_models[mode+"-shake"] = AutoModelWithLMHead.from_pretrained(mode_paths['transfer_shake'])
            transfer_models[mode+"-abs"] = AutoModelWithLMHead.from_pretrained(mode_paths['transfer_abs'])
            transfer_models[mode+"-wiki"] = AutoModelWithLMHead.from_pretrained(mode_paths['transfer_wiki'])

        elif mode in ['micro-joint']:
            mode_paths = MODEL_PATHS[mode]
            transfer_models[mode] = AutoModelWithLMHead.from_pretrained(mode_paths['transfer'])


@app.route("/hello")
def hello():
    res = {
        "world": 42,
        "app": "ml"
    }
    return res


@app.route("/swap_models", methods=['POST'])
def swap_models():
    mode = request.args.get('mode', type = str)
    print(mode)
    try:
        load_models(mode)
    except Exception as e:
       print(e)
       return {'message' : 'Models Swap Failure! :('}, 500

    return {'message' : 'Models Swap Success! :)'}, 200


@app.route('/classification', methods = ['GET'])
def get_joint_classify_and_salience():
    '''
    Inputs:
    Input is assumed to be json of the form
      {text: "some text"}.

    Results:
      Run ML classification model on text.

    Returns:
      res: a dict containing information on
        classification and input salience weights.
        It has a key 'tokens' which is an array of the
        tokenized input text. It also has a key for each
        classification task. Each of these are themselves
        dicts containing keys for the predicted class,
        the probability of this class, and also the salience score
        for each token from the tokenized input.
    '''
    # Get text input from request
    text = request.args.get('text', type = str)
    text = text.strip()
    lower = text.lower()
    mode = request.args.get('mode', type = str)
    tokens = []
    sentence_seen = 0

    joint_tokens = classifier_tokenizer.convert_ids_to_tokens(classifier_tokenizer.encode(lower))[1:-1]
    for token in joint_tokens:
        # Handle case where the tokenizer splits some suffix as it's own token
        if len(token) > 2:
          if token[:2] == '##':
            token = token[2:]
        occ = lower[sentence_seen:].find(token)
        start = occ + sentence_seen
        end = start + len(token)
        adj_len = len(token)
        sentence_seen = sentence_seen + adj_len + occ
        tokens.append({'text' : text[start:end], 'start' : start, 'end' : end})


    if mode=='micro-joint':
        res = classifier_trainers['micro-formality'].predict_for_sentence(lower, classifier_tokenizer, salience=True)
    else:
        res = classifier_trainers[mode].predict_for_sentence(lower, classifier_tokenizer, salience=True)
    res['tokens'] = tokens
    return res, 200

@app.route('/transfer', methods = ['GET'])
def get_transfer():
    # Get text input from request
    text = request.args.get('text', type = str)
    mode = request.args.get('mode', type = str)
    styles = request.args.get('style', type = str)
    controls = request.args.get('controls', type = str)
    text = text.strip()
    lower = text.lower()
    controls = json.loads(controls)
    conversion = ['very low', 'low', 'mid', 'high', 'very high']
    paras = []
    print(controls)
    controls['suggestions'] = int(min(5,max(1,float(controls['suggestions']))))

    if styles=='formality_emo':
        form_level = conversion[controls['formality']]
        emo_level = conversion[controls['emo']]
        # Say these are the values you are getting from the GUI
        # transfer: did you hear about his problems, lol | input politeness: low | input emotion: low | output politeness: high | output emotion: high
        chunk = [text, form_level, emo_level]
        temp = 'transfer: ' + chunk[0] + ' | output formality: '+chunk[1] +' | output emotion: '+chunk[2]
        print(temp)
        tokenized = tokenizer([temp], padding='max_length', return_tensors='pt', truncation = False)
        all_input_ids, all_attention_mask = tokenized['input_ids'], tokenized['attention_mask']
        outputs = formality_emo.generate(
                            input_ids=all_input_ids,
                            attention_mask=all_attention_mask,
                            # do_sample=False, # disable sampling to test if batching affects output,
                            num_beams=9,
                            early_stopping=True,
                            num_return_sequences=3,
                            max_length=50,
                            no_repeat_ngram_size=2,
                            num_beam_groups=3,
                            diversity_penalty=0.3,
                        )
        paras = tokenizer.batch_decode(outputs, skip_special_tokens=True)
        print(paras)
    elif styles=='politeness_emo':
        form_level = controls['formality']
        emo_level = controls['emo']
        t = tokenizer(lower, return_tensors='pt')
        outputs = politeness_emo.generate(t.input_ids, 
                                attention_mask=t.attention_mask,
                                max_length=50, 
                                num_beams=9,
                                early_stopping=True,
                                encoder_no_repeat_ngram_size=5,
                                no_repeat_ngram_size=4,
                                num_beam_groups=3,
                                diversity_penalty=0.5,
                                num_return_sequences=3)
        paras = tokenizer.batch_decode(outputs.detach().cpu().numpy(), skip_special_tokens=True)
        # returned = tokenizer.decode(outputs[0], skip_special_tokens=True)
        print(paras)
    
    edit_ops = []
    for para in paras:
        temp = []
        ops = lev.editops(lower, para)
        print(ops)
        for op in ops:
            temp.append(op)
        edit_ops.append(temp)
        # print(lev.distance(lower, para))
    print('TRYING DIFFLIB')
    for para in paras:
        for diff in dl.context_diff(lower.split(' '), para.split(' ')):
            print(diff)
        print('===================')
    print(edit_ops)
    res = {'returned': paras, 'ops': edit_ops}
    return res, 200

def load_openai_key():
    with open("./key.txt") as fob:
        openai.api_key = fob.read().strip()

def get_openai_result(text):
   prompt = "Plain Language: what're u doin?\nFormal Language: What are you doing?\nPlain Language: what's up?\nFormal Language: What is up?\nPlain Language: i wanna eat ice cream today!\nFormal Language: I want to eat ice cream today.\nPlain Language: wtf is his problem?\nFormal Language: What is his issue?\nPlain Language: i feel bummed about the store shutting down.\nFormal Language: I feel unhappy about the store closing.\nPlain Language: "

   prompt = prompt + text + "\nFormal Language:"
   res = openai.Completion.create(
       engine="davinci",
      prompt= prompt,
       max_tokens=64,
       temperature=0.15,
       stop="\n"
   )

   return res.choices[0].text.strip()

if __name__ == '__main__':
    # load_models(['micro-formality','macro-shakespeare','micro-joint','macro-binary'])
    # print(transfer_models.keys())
    parser = argparse.ArgumentParser()
    parser.add_argument('--openai', help='Use openai API or not', default=False)
    global server_args
    server_args = parser.parse_args()
    sandbox_init()

    if server_args.openai==True:
        load_openai_key()

    app.run(host="0.0.0.0", port=5001)
