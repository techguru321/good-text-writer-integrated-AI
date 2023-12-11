import React, { useState } from 'react';
import { createEditor, Editor, Node, Transforms } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import OpenAI from 'openai';
import { CircularProgress, IconButton, List, ListItem, ListItemButton, ListItemText, Popover, TextareaAutosize } from '@mui/material';
import { Search } from '@mui/icons-material';
import { OpenAIKey, OpenAIModel } from './credentials';

const openai = new OpenAI({
    apiKey: OpenAIKey,
    dangerouslyAllowBrowser: true
});

const initialContent = [{
    type: 'paragraph',
    children: [{ 
        text: '' 
    }],
}];

const editor = withReact(createEditor()); 

const addText = (text) => {
    if (editor.children.length < 1) {
        Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] })
    }

    Transforms.insertText(editor, text, {at: [0]});
}

const TextEditor = () => {
    const [title, setTitle] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [popoverList, setPopoverList] = useState([]);
    const [popoverPosition, setPopoverPosition] = useState({});

    const generateText = async (text) => {
        setIsLoading(false);
        const response = await openai.chat.completions.create({
            model: OpenAIModel, // gpt-3.5-turbo
            messages: [{ role: 'user', content: text }],
        });
        setIsLoading(true);
        return response;
    };

    const handleTitleKeyPress = (event) => {
        if (event.key === 'Enter') {
            generateText(title).then(response => {
                addText(response.choices[0].message.content)
            });
        }
    }

    const handleEditorSelect = (event) => {
        let position = {};
        if (event.nativeEvent.y < Number(document.documentElement.clientHeight / 2))
            position.top= event.nativeEvent.y + 'px';
        else
            position.bottom = (document.documentElement.clientHeight - event.nativeEvent.y) + 'px';

        if (event.nativeEvent.x < Number(document.documentElement.clientWidth / 2))
            position.left = event.nativeEvent.x + 'px';
        else
            position.right = (document.documentElement.clientWidth - event.nativeEvent.x) + 'px';
        setPopoverPosition(position);
        const {anchor, focus} = editor.selection;
        const selectedText = Editor.string(editor, {anchor, focus});
        if (selectedText !== '') {
            generateText(selectedText).then(response => {
                setPopoverOpen(true);
                setPopoverList([response.choices[0].message.content.replace('\n', '<br>')]);
                // addText(response.choices[0].message.content)
            });
        }
    }

    const handlePopoverItemClick = () => {
        setPopoverOpen(false);
    }

    const handleSearchClick = (event) => {
        const content  = editor.children.map(node => Node.string(node)).join('');
        generateText(content).then(response => {
            addText(response.choices[0].message.content)
        })
    }
    return (
        <>
            {!isLoading && (
                <div className='fixed w-[100%] h-[100vh] z-10 bg-black/20 flex justify-center items-center'>
                    <CircularProgress color='success'/>
                </div>
            )}
            <div className='px-[5%] py-[100px] relative'>
                <div className='w-full mb-[10px]'>
                    {/* <TextField label="Title" variant="standard" className='w-full' value={title} onChange={event => setTitle(event.target.value)} onKeyDown={handleTitleKeyPress} /> */}
                    <TextareaAutosize className='w-full border-b focus-visible:border-sky-500 focus:border-sky-500' minLength={3} value={title} value={title} onChange={event => setTitle(event.target.value)} onKeyDown={handleTitleKeyPress} />
                </div>
                <Slate editor={editor} initialValue={initialContent}>
                    <IconButton className="!absolute right-[5%] bottom-[100px] z-10" onClick={handleSearchClick}>
                        <Search />
                    </IconButton>
                    <Editable onSelect={handleEditorSelect}  className="w-full border rounded-md py-[5px] px-[10px]"/>
                    <Popover open={popoverOpen} transition className="absolute" style={popoverPosition}>
                        {/* <Fade timeout={350}> */}    
                            <List className='opacity-100 visible'>
                                {popoverList.map(popoverItem => {
                                    return (
                                        <ListItem>
                                            <ListItemButton onClick={handlePopoverItemClick}>
                                                <ListItemText primary={popoverItem} />
                                            </ListItemButton>
                                        </ListItem>
                                    );
                                })}
                            </List>
                        {/* </Fade> */}
                    </Popover>
                </Slate>
            </div>
        </>
    );
};

export default TextEditor;
