import * as React from 'react';

interface Props {
    title: string;
    url: string;
    descriptions: string;
    imageUrl: string;
    imageCaption?: string;
}

const CalciteCard:React.FC<Props> = ({
    title,
    url,
    descriptions,
    imageUrl,
    imageCaption
})=>{

    return (
        <div 
            className='card block trailer-half'
        >
            <figure 
                style={{
                    'position': "relative",
                    'marginBottom': '.25rem'
                }}
            >
                <img className="card-image" src={imageUrl} alt={title} />
                <figcaption 
                    className="card-image-caption text-white text-left"
                    style={{
                        'backgroundColor': 'rgba(0,0,0,.5)'
                    }}
                >
                    <span className="font-size--2">{imageCaption}</span>
                </figcaption>
            </figure>

            <div className='card-content text-left'>
                <div className="font-size-0 trailer-half">
                    <a href={url} 
                       target="_blank"
                       rel="noopener"
                       style={
                           {
                               color: '#D52B1E',
                               textDecoration: 'none',
                           }
                       }
                       onMouseEnter={e => (e.currentTarget.style.color = '#A31A13')}
                       onMouseLeave={e => (e.currentTarget.style.color = '#D52B1E')}
                    >
                        {title}
                    </a>
                </div>

                <p className='font-size--2 trailer-half'>
                    {descriptions}
                </p>
            </div>
        </div>
    )
};

export default CalciteCard;