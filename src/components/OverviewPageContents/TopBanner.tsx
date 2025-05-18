import * as React from 'react';

import TopBannerBackgroundImg from '../../statics/img/OverviewPage/banner.jpg';

const TopBanner:React.FC = ()=>{

    return (
        <div
            style={{
                'padding': '6rem 0',
                'backgroundImage': `url(${TopBannerBackgroundImg})`,
                'backgroundSize': 'cover',
                'backgroundRepeat': 'no-repeat',
                'backgroundPositionX': 'center',
                'backgroundPositionY': 'center',
            }}
        >
            <div className='grid-container'>
                <div
                    className='column-14 center-column text-center'
                    style={{
                        'padding': '35px 50px',
                        'color': '#fff',
                        'backgroundColor': 'rgba(0, 0, 0, 0.7)'
                    }}
                >
                    <h1 className="sub-nav-title trailer-1">Maps that Power Life-Saving Decisions</h1>

                    <div
                        style={{
                            'height': '3px',
                            'width': '60px',
                            'backgroundColor': '#fff',
                            'margin': '0 auto 25px'
                        }}
                    ></div>

                    <h5 className='trailer-1'>Humanitarian maps reveal where help is most needed.</h5>

                    <h5 className="avenir-light">Explore ready‑to‑use data layers, dashboards and learning resources that empower the Lebanese Red Cross — and our partners — to act quickly and effectively when lives are on the line.</h5>
                </div>
            </div>

        </div>
    );
};

export default React.memo(TopBanner);