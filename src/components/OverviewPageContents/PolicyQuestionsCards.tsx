import * as React from 'react';

import {
    CardCarousel
} from '../';

import {
    AgolItem
} from '../../utils/arcgis-online-item-formatter';

import { 
    fetchResourcesData 
} from '../../utils/policy-maps-resources-data/fetchResourcesData';

const PolicyQuestionsCards:React.FC = ()=>{

    const [ cardsData, setCardsData ] = React.useState<AgolItem[]>([]);

    const fetchPolicyQuestions = async()=>{

        try {
            const cardsData = await fetchResourcesData({
                categories: ['In the News']
            });

            setCardsData(cardsData);

        } catch(err){
            console.error(err);
        }

    };

    React.useEffect(()=>{
        fetchPolicyQuestions();
    }, [])

    return (
        <div className='leader-3 trailer-3'>
            <div className='grid-container'>

                <div className='column-10 center-column text-center'>
                    <h3 className="text-red avenir-light trailer-1">Humanitarian Questions We&rsquo;re Tackling</h3>
                    <p className="font-size--1 trailer-2">Discover the pressing challenges in Lebanon—then explore our data-driven approaches to saving lives and building resilience.</p>
                </div>

                <div className='column-18 center-column text-center'>
                    <CardCarousel 
                        cardsData={cardsData}
                    />
                </div>
                
            </div>
        </div>
    );
};

export default PolicyQuestionsCards;