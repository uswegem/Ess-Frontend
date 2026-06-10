import React from 'react'

const TopNavigator = ({ title, para }) => {
    return (
        <div>
            <div className='topNavigator'>
                <h4>{title}</h4>
                <p>{para}</p>
            </div>
        </div>
    )
}

export default TopNavigator
