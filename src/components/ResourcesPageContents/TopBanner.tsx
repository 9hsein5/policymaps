import React from 'react';
import TopBannerBackgroundImage from '../../statics/img/ResourcesPage/TopBanner1.png';

const TopBanner:React.FC = ()=>{

    const getBackgroundImage = ()=>{
        return (
            <div
                style={{
                    'position': 'absolute',
                    'top': 0,
                    'left': 0,
                    'width': '100%',
                    'height': '100%',
                    'background': `url(${TopBannerBackgroundImage}) center center no-repeat`, //'linear-gradient(to right bottom, #004874 0%, #572561 100%)'
                    'backgroundSize':' cover'
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0,0,0,.25)'
                    }}
                />
            </div>
        );
    }

    return (
        <div
            style={{
                position: 'relative',
                paddingTop: '4rem',
                paddingBottom: '4rem'
            }}
        >
            { getBackgroundImage() }

            <div
                className='grid-container'
                style={{
                    position: 'relative',
                }}
            >
                <div 
                    className='column-12 center-column text-center text-white'
                    style={{
                        
                        textShadow: '0px 0px 3px #000'
                    }}
                >
                    <h2 className="trailer-1">Get the Most Out of Policy Maps</h2>
                    <div 
                        style={{
                            'height': '3px',
                            'width': '60px',
                            'backgroundColor': '#fff',
                            'margin': '0 auto 10px'
                        }}
                    ></div>
                    <p className="leader-2">To fully leverage our mapping platform, the Lebanese Red Cross has curated a suite of learning resources—including tutorials, field-tested best practices, and real-world case studies—that build your data skills, offer reusable map templates, and connect you with fellow practitioners driving humanitarian action across Lebanon.</p>
                </div>
            </div>
        </div>

    )
};

export default React.memo(TopBanner);