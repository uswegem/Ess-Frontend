import  './search.css';
import {Search} from '@mui/icons-material/';

export default function SearchBar() {
    const clickEvent = () => {
        window.alert('hi')
    }
   return (
    
    <div className='searchBar'>
        <input type="text" placeholder=' Search... ' className='searchBarInput' />
        <Search className='searchIcon' onClick={clickEvent}/>
    </div>
    
  )
}
