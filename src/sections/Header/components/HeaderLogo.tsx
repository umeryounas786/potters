import { useNavigate } from 'react-router-dom';
import logo from '@/assets/images/logo3.jpeg';

export const HeaderLogo = () => {
  const navigate = useNavigate();
  return (
    <h2 className="text-neutral-800 box-border caret-transparent col-end-[heading] col-start-[heading] row-end-[heading] row-start-[heading] justify-self-center leading-[0px] min-h-[auto] min-w-[auto] text-center md:justify-self-start md:text-start">
      <button
        onClick={() => navigate('/')}
        className="box-border caret-transparent inline-block col-end-[heading] col-start-[heading] row-end-[heading] row-start-[heading] justify-self-center text-center underline-offset-[3px] ml-0 p-[7.5px] md:justify-self-start md:ml-[-7.5px] md:text-start"
      >
        <div className="box-border caret-transparent inline-block text-center underline-offset-[3px] w-full md:text-start">
          <img
            src={logo}
            alt="Arraish"
            className="box-border caret-transparent inline max-w-full align-baseline h-10 w-auto md:h-12"
          />
        </div>
      </button>
    </h2>
  );
};
